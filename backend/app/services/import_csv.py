from __future__ import annotations

import hashlib
import io
import traceback
from datetime import datetime, date
from typing import Dict, Any, List

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.models import Consulta, Paciente, PrestacionUsuario, Prestacion
from app.schemas import PacienteCreate
from app.utils.normalizers import (
    extraer_monto_numerico,
    normalizar_fecha_flexible,
    normalizar_medio_pago,
)


class ImportCsvService:
    @staticmethod
    def _generate_import_hash(usuario_id: int, paciente_id: int, prestacion_id: int, fecha: date, monto: float) -> str:
        """
        Generar hash único para detectar duplicados
        NOTA: NO incluye el monto para permitir múltiples consultas del mismo tratamiento
        en la misma fecha con diferentes montos (ej: cuotas, pagos parciales)
        """
        unique_string = f"{usuario_id}_{paciente_id}_{prestacion_id}_{fecha}_{monto}"
        return hashlib.sha256(unique_string.encode()).hexdigest()
    
    @staticmethod
    def _normalize_malformed_csv(content: bytes) -> bytes:
        """
        Normaliza CSVs mal formateados donde toda la fila está entre comillas.
        
        Ejemplo de entrada (MAL):
        "01-03-2025,Daira Baez (transf),Endodoncia,""$100.000"",TRANSFERENCIA"
        
        Salida esperada (BIEN):
        01-03-2025,"Daira Baez (transf)",Endodoncia,"$100.000",TRANSFERENCIA
        """
        try:
            # Decodificar a string
            text = content.decode('utf-8-sig')  # utf-8-sig elimina BOM si existe
        except UnicodeDecodeError:
            try:
                text = content.decode('latin1')
            except:
                return content  # Si falla, devolver original
        
        lines = text.split('\n')
        normalized_lines = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Si es la cabecera, dejarla como está
            if i == 0 or ',' not in line:
                normalized_lines.append(line)
                continue
            
            # Detectar si toda la línea está entre comillas
            if line.startswith('"') and line.endswith('"'):
                # Quitar comillas externas
                line = line[1:-1]
                # Reemplazar comillas dobles escapadas ("") por comillas simples (")
                line = line.replace('""', '"')
            
            normalized_lines.append(line)
        
        # Re-unir y convertir a bytes
        normalized_text = '\n'.join(normalized_lines)
        return normalized_text.encode('utf-8')
    
    @staticmethod
    def importar_csv(
        db: Session, usuario_id: int, csv_content: bytes, col_paciente: str, col_tratamiento: str, col_monto: str,
        col_fecha: str = None, col_medio_pago: str = None
    ) -> Dict[str, Any]:
        """
        Importar consultas desde CSV con detección de duplicados
        
        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            csv_content: Contenido del archivo CSV en bytes
            col_paciente: Nombre de la columna del paciente
            col_tratamiento: Nombre de la columna del tratamiento
            col_monto: Nombre de la columna del monto
            col_fecha: Nombre de la columna de fecha (opcional)
            col_medio_pago: Nombre de la columna del medio de pago (opcional)
        
        Returns:
            Diccionario con resultado de la importación
        """
        print(f"\n{'='*80}")
        print(f"📥 INICIANDO IMPORTACIÓN CSV para usuario {usuario_id}")
        print(f"{'='*80}")
        print(f"Columnas mapeadas:")
        print(f"  - Paciente: {col_paciente}")
        print(f"  - Tratamiento: {col_tratamiento}")
        print(f"  - Monto: {col_monto}")
        print(f"  - Fecha: {col_fecha or 'No especificada (usar hoy)'}")
        print(f"  - Medio de pago: {col_medio_pago or 'No especificado (usar efectivo)'}")
        
        # Pre-procesar CSV para normalizar formatos mal formateados
        csv_content = ImportCsvService._normalize_malformed_csv(csv_content)
        
        # Leer CSV con manejo correcto de comillas para campos con comas
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        df = None
        for enc in encodings:
            try:
                # quotechar='"' maneja campos como "García, Juan" correctamente
                # skipinitialspace=True elimina espacios después de delimitadores
                df = pd.read_csv(
                    io.BytesIO(csv_content), 
                    encoding=enc,
                    quotechar='"',
                    skipinitialspace=True,
                    on_bad_lines='warn'  # Advertir sobre líneas problemáticas en lugar de fallar
                )
                print(f"\n✅ CSV leído exitosamente con encoding: {enc}")
                break
            except (UnicodeDecodeError, pd.errors.ParserError) as e:
                print(f"❌ Falló encoding {enc}: {str(e)}")
                continue

        if df is None:
            error_msg = "No se pudo leer el archivo CSV. Verifica el formato y encoding."
            print(f"\n❌ {error_msg}")
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "duplicados": 0,
                "error": error_msg
            }
        
        # Limpiar DataFrame
        df = df.dropna(how='all')  # Eliminar filas completamente vacías
        df = df[df[col_monto].notna()]  # Eliminar filas sin monto
        
        print(f"\n📊 Archivo CSV:")
        print(f"  - Total filas (incluyendo encabezado): {len(df) + 1}")
        print(f"  - Filas con datos válidos: {len(df)}")
        print(f"  - Columnas detectadas: {list(df.columns)}")
        
        # Obtener hashes existentes para detectar duplicados
        existing_hashes = set()
        existing_consultas = db.query(Consulta.import_hash).filter(
            Consulta.usuario_id == usuario_id,
            Consulta.import_hash.isnot(None)
        ).all()
        existing_hashes = {c.import_hash for c in existing_consultas}
        print(f"\n📌 Consultas existentes con hash: {len(existing_hashes)}")

        # Cargar mapas de pacientes y prestaciones
        print(f"\n🔍 Cargando datos existentes...")
        pacientes_map = {}
        pacientes = db.query(Paciente).filter(Paciente.usuario_id == usuario_id).all()
        for p in pacientes:
            key = f"{p.nombre} {p.apellido}".lower().strip()
            pacientes_map[key] = p.id
        print(f"  - Pacientes existentes: {len(pacientes_map)}")

        prestaciones_map = {}
        prestaciones = db.query(PrestacionUsuario).filter(PrestacionUsuario.usuario_id == usuario_id).all()
        for p in prestaciones:
            name = (p.nombre_personalizado or (p.prestacion.nombre if p.prestacion else "")).lower().strip()
            if name:
                prestaciones_map[name] = p.id
        print(f"  - Prestaciones de usuario existentes: {len(prestaciones_map)}")

        # Procesar filas
        consultas_creadas = []
        errores_detalle = []
        duplicados = 0
        total_ars = 0

        print(f"\n{'='*80}")
        print(f"🔄 PROCESANDO {len(df)} FILAS")
        print(f"{'='*80}\n")

        for idx, row in df.iterrows():
            fila_num = idx + 2  # +2 porque pandas usa 0-index y hay encabezado
            try:
                # 1. Validar y obtener paciente
                if pd.isna(row[col_paciente]) or str(row[col_paciente]).strip() == '':
                    print(f"⚠️  Fila {fila_num}: Paciente vacío - SALTANDO")
                    errores_detalle.append(f"Fila {fila_num}: Paciente vacío")
                    continue
                    
                paciente_name = str(row[col_paciente]).strip()
                paciente_key = paciente_name.lower().strip()
                paciente_id = pacientes_map.get(paciente_key)
                
                if not paciente_id:
                    # Use improved find_or_create method to prevent duplicates
                    from app.services.pacientes import PacientesService
                    name_parts = paciente_name.split(maxsplit=1)
                    nombre = name_parts[0] if name_parts else "Desconocido"
                    apellido = name_parts[1] if len(name_parts) > 1 else ""
                    
                    # Generate temporary DNI for CSV imports (format: CSV-timestamp-hash)
                    # This ensures uniqueness while being identifiable as CSV import
                    import time
                    temp_dni = f"CSV-{int(time.time())}-{abs(hash(paciente_name)) % 10000:04d}"
                    
                    # Find or create patient with temporary DNI
                    try:
                        paciente = PacientesService.find_or_create_paciente(
                            db, nombre, apellido, temp_dni, usuario_id
                        )
                        paciente_id = paciente.id
                        pacientes_map[paciente_key] = paciente_id
                        
                        if paciente.fecha_registro.date() == date.today():
                            print(f"  ➕ Fila {fila_num}: Paciente nuevo creado: '{paciente_name}' (ID: {paciente_id}, DNI temp: {temp_dni})")
                        else:
                            print(f"  🔍 Fila {fila_num}: Paciente existente encontrado: '{paciente_name}' (ID: {paciente_id})")
                    except ValueError as e:
                        # If DNI validation fails, create directly with PacienteCreate
                        paciente_dto = PacienteCreate(
                            nombre=nombre,
                            apellido=apellido,
                            dni=temp_dni
                        )
                        from app.repositories.pacientes import create_paciente
                        paciente = create_paciente(db, paciente_dto, usuario_id)
                        paciente_id = paciente.id
                        pacientes_map[paciente_key] = paciente_id
                        print(f"  ➕ Fila {fila_num}: Paciente nuevo creado (directo): '{paciente_name}' (ID: {paciente_id}, DNI temp: {temp_dni})")

                # 2. Validar y obtener tratamiento
                if pd.isna(row[col_tratamiento]) or str(row[col_tratamiento]).strip() == '':
                    print(f"⚠️  Fila {fila_num}: Tratamiento vacío - SALTANDO")
                    errores_detalle.append(f"Fila {fila_num}: Tratamiento vacío")
                    continue
                    
                tratamiento_name = str(row[col_tratamiento]).strip()
                tratamiento_key = tratamiento_name.lower().strip()
                prestacion_usuario_id = prestaciones_map.get(tratamiento_key)
                
                if not prestacion_usuario_id:
                    # Buscar prestación de usuario existente en BD
                    existing_prestacion = db.query(PrestacionUsuario).filter(
                        PrestacionUsuario.usuario_id == usuario_id,
                        PrestacionUsuario.nombre_personalizado.ilike(tratamiento_name)
                    ).first()
                    
                    if existing_prestacion:
                        prestacion_usuario_id = existing_prestacion.id
                        prestaciones_map[tratamiento_key] = prestacion_usuario_id
                        print(f"  🔍 Fila {fila_num}: Tratamiento encontrado: '{tratamiento_name}' (ID: {prestacion_usuario_id})")
                    else:
                        # Buscar o crear prestación base
                        from app.services.prestaciones_usuario import PrestacionesUsuarioService
                        
                        # Buscar prestación base por nombre similar
                        prestacion_base = db.query(Prestacion).filter(
                            Prestacion.nombre.ilike(f"%{tratamiento_name}%")
                        ).first()
                        
                        if not prestacion_base:
                            # Buscar por palabras clave comunes
                            keywords = {
                                'consulta': 'Consulta',
                                'limpieza': 'Limpieza',
                                'operatoria': 'Operatoria',
                                'endodoncia': 'Endodoncia',
                                'blanqueamiento': 'Blanqueamiento',
                                'placa': 'Placa Oclusal',
                                'corona': 'Corona',
                                'prótesis': 'Prótesis',
                                'obra': 'Consulta'  # obra social
                            }
                            
                            for keyword, prestacion_nombre in keywords.items():
                                if keyword in tratamiento_name.lower():
                                    prestacion_base = db.query(Prestacion).filter(
                                        Prestacion.nombre.ilike(f"%{prestacion_nombre}%")
                                    ).first()
                                    if prestacion_base:
                                        break
                        
                        # Si aún no hay prestación base, usar la primera disponible o crear genérica
                        if not prestacion_base:
                            prestacion_base = db.query(Prestacion).first()
                            
                        if not prestacion_base:
                            print(f"❌ Fila {fila_num}: No hay prestaciones base en el sistema - SALTANDO")
                            errores_detalle.append(f"Fila {fila_num}: No hay prestaciones base")
                            continue
                        
                        # Crear prestación de usuario (con manejo de duplicados)
                        from app.schemas.prestacion_usuario import PrestacionUsuarioCreate
                        try:
                            prestacion_dto = PrestacionUsuarioCreate(
                                prestacion_id=prestacion_base.id,
                                nombre_personalizado=tratamiento_name
                            )
                            prestacion = PrestacionesUsuarioService.create_prestacion_usuario(db, prestacion_dto, usuario_id)
                            prestacion_usuario_id = prestacion.id
                            prestaciones_map[tratamiento_key] = prestacion_usuario_id
                            print(f"  ➕ Fila {fila_num}: Tratamiento nuevo: '{tratamiento_name}' (ID: {prestacion_usuario_id}, Base: {prestacion_base.nombre})")
                        except Exception as e:
                            db.rollback()
                            consultas_creadas.clear()
                            total_ars = 0
                            
                            # Si falla por duplicado, buscar la prestación existente
                            if "unique_usuario_prestacion" in str(e).lower() or "duplicate" in str(e).lower():
                                # Buscar por usuario_id y prestacion_id (el constraint real)
                                existing = db.query(PrestacionUsuario).filter(
                                    PrestacionUsuario.usuario_id == usuario_id,
                                    PrestacionUsuario.prestacion_id == prestacion_base.id
                                ).first()
                                
                                if existing:
                                    # Si existe pero con otro nombre, actualizarlo
                                    if existing.nombre_personalizado != tratamiento_name:
                                        existing.nombre_personalizado = tratamiento_name
                                        db.commit()
                                        print(f"  🔄 Fila {fila_num}: Tratamiento actualizado: '{existing.nombre_personalizado}' -> '{tratamiento_name}' (ID: {existing.id})")
                                    else:
                                        print(f"  🔍 Fila {fila_num}: Tratamiento ya existía: '{tratamiento_name}' (ID: {existing.id})")
                                    
                                    prestacion_usuario_id = existing.id
                                    prestaciones_map[tratamiento_key] = prestacion_usuario_id
                                else:
                                    # Buscar también por nombre por si acaso
                                    existing_by_name = db.query(PrestacionUsuario).filter(
                                        PrestacionUsuario.usuario_id == usuario_id,
                                        PrestacionUsuario.nombre_personalizado == tratamiento_name
                                    ).first()
                                    
                                    if existing_by_name:
                                        prestacion_usuario_id = existing_by_name.id
                                        prestaciones_map[tratamiento_key] = prestacion_usuario_id
                                        print(f"  🔍 Fila {fila_num}: Tratamiento encontrado por nombre: '{tratamiento_name}' (ID: {prestacion_usuario_id})")
                                    else:
                                        print(f"❌ Fila {fila_num}: Error creando tratamiento '{tratamiento_name}': {e}")
                                        errores_detalle.append(f"Fila {fila_num}: Error en tratamiento")
                                        continue
                            else:
                                print(f"❌ Fila {fila_num}: Error inesperado creando tratamiento: {e}")
                                errores_detalle.append(f"Fila {fila_num}: Error en tratamiento")
                                continue

                # 3. Validar y extraer monto
                if pd.isna(row[col_monto]) or str(row[col_monto]).strip() == '':
                    print(f"⚠️  Fila {fila_num}: Monto vacío - SALTANDO")
                    errores_detalle.append(f"Fila {fila_num}: Monto vacío")
                    continue
                    
                monto_str = str(row[col_monto])
                monto_ars = extraer_monto_numerico(monto_str)
                
                if monto_ars <= 0:
                    print(f"⚠️  Fila {fila_num}: Monto inválido '{monto_str}' -> {monto_ars} - SALTANDO")
                    errores_detalle.append(f"Fila {fila_num}: Monto inválido: {monto_str}")
                    continue
                
                print(f"  💰 Fila {fila_num}: Monto extraído: {monto_str} -> ${monto_ars:,.0f}")

                # 4. Extraer fecha
                if col_fecha and not pd.isna(row.get(col_fecha)):
                    try:
                        fecha_str = str(row[col_fecha]).strip()
                        fecha_iso = normalizar_fecha_flexible(fecha_str)
                        fecha_consulta = datetime.fromisoformat(fecha_iso).date()
                    except Exception as e:
                        print(f"⚠️  Fila {fila_num}: Error en fecha '{row.get(col_fecha)}', usando hoy: {e}")
                        fecha_consulta = date.today()
                else:
                    fecha_consulta = date.today()

                # 5. Extraer medio de pago
                if col_medio_pago and not pd.isna(row.get(col_medio_pago)):
                    try:
                        medio_str = str(row[col_medio_pago]).strip()
                        medio_pago = normalizar_medio_pago(medio_str)
                    except Exception as e:
                        print(f"⚠️  Fila {fila_num}: Error en medio de pago '{row.get(col_medio_pago)}', usando efectivo: {e}")
                        medio_pago = "efectivo"
                else:
                    medio_pago = "efectivo"

                # 6. Generar hash y verificar duplicado
                import_hash = ImportCsvService._generate_import_hash(
                    usuario_id, paciente_id, prestacion_usuario_id, fecha_consulta, monto_ars
                )
                
                if import_hash in existing_hashes:
                    print(f"  ⏭️  Fila {fila_num}: Duplicado detectado - SALTANDO")
                    duplicados += 1
                    continue

                # 7. Crear consulta
                from app.models.consultas import MedioPago, EstadoConsulta
                consulta = Consulta(
                    paciente_id=paciente_id,
                    prestacion_usuario_id=prestacion_usuario_id,
                    usuario_id=usuario_id,
                    fecha_consulta=fecha_consulta,
                    monto_ars=monto_ars,
                    medio_pago=MedioPago(medio_pago),
                    estado=EstadoConsulta.completada,
                    import_hash=import_hash
                )
                
                db.add(consulta)
                db.flush()  # Obtener ID sin hacer commit
                
                consultas_creadas.append(consulta)
                existing_hashes.add(import_hash)
                total_ars += monto_ars
                
                print(f"  ✅ Fila {fila_num}: Consulta creada - {paciente_name} | {tratamiento_name} | ${monto_ars:,.0f}")

            except Exception as e:
                error_msg = f"Fila {fila_num}: {str(e)}"
                errores_detalle.append(error_msg)
                print(f"  ❌ {error_msg}")
                print(f"     Traceback: {traceback.format_exc()}")
                # Rollback wipes ALL flushed data (including prior rows), so
                # reset the success counters to avoid reporting phantom inserts.
                db.rollback()
                consultas_creadas.clear()
                total_ars = 0
                continue

        # Commit final
        try:
            if consultas_creadas:
                db.commit()
                print(f"\n✅ Commit exitoso: {len(consultas_creadas)} consultas guardadas")
            else:
                print(f"\n⚠️  No hay consultas nuevas para guardar")
        except Exception as e:
            db.rollback()
            error_msg = f"Error al guardar consultas: {str(e)}"
            print(f"\n❌ {error_msg}")
            return {
                "migrados": 0,
                "errores": len(df),
                "total_ars": 0,
                "duplicados": duplicados,
                "error": error_msg
            }

        result = {
            "migrados": len(consultas_creadas),
            "errores": len(errores_detalle),
            "duplicados": duplicados,
            "total_ars": round(total_ars, 0),
        }
        
        print(f"\n{'='*80}")
        print(f"📊 RESULTADO FINAL")
        print(f"{'='*80}")
        print(f"✅ Consultas importadas: {result['migrados']}")
        print(f"⏭️  Duplicados omitidos: {result['duplicados']}")
        print(f"❌ Errores: {result['errores']}")
        print(f"💰 Total ARS: ${result['total_ars']:,.0f}")
        print(f"{'='*80}\n")
        
        return result
