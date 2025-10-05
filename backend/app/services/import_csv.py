from __future__ import annotations

import io
from typing import Dict, Any, List

import pandas as pd
from sqlalchemy.orm import Session

from app.services.consultas import ConsultasService
from app.utils.normalizers import (
    extraer_monto_numerico,
    normalizar_fecha_flexible,
    normalizar_medio_pago,
)
from app.schemas import ConsultaCreate


class ImportCsvService:
    @staticmethod
    def importar_csv(
        db: Session, usuario_id: int, csv_content: bytes, col_paciente: str, col_tratamiento: str, col_monto: str,
        col_fecha: str = None, col_medio_pago: str = None
    ) -> Dict[str, Any]:
        """
        Importar consultas desde CSV
        
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
        print(f"📥 Iniciando importación CSV para usuario {usuario_id}")
        print(f"Columnas recibidas: paciente={col_paciente}, tratamiento={col_tratamiento}, monto={col_monto}")
        
        # Detect encoding
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        df = None
        for enc in encodings:
            try:
                df = pd.read_csv(io.BytesIO(csv_content), encoding=enc)
                print(f"✅ CSV leído con encoding: {enc}")
                break
            except UnicodeDecodeError:
                continue

        if df is None:
            print("❌ No se pudo leer el archivo CSV con ningún encoding")
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "error": "No se pudo leer el archivo CSV. Verifica el formato."
            }
        
        print(f"📊 CSV tiene {len(df)} filas y columnas: {list(df.columns)}")

        consultas_creadas = []
        errores = 0
        total_ars = 0

        # Map prestaciones_usuario for tratamientos (simplified, assume by name)
        prestaciones_map = {}
        from app.models import PrestacionUsuario
        prestaciones = db.query(PrestacionUsuario).filter(PrestacionUsuario.usuario_id == usuario_id).all()
        for p in prestaciones:
            name = p.nombre_personalizado or (p.prestacion.nombre if p.prestacion else "")
            prestaciones_map[name.lower()] = p.id

        # Map pacientes (simplified, assume by name+apellido)
        pacientes_map = {}
        from app.models import Paciente
        from app.schemas import PacienteCreate
        pacientes = db.query(Paciente).filter(Paciente.usuario_id == usuario_id).all()
        for p in pacientes:
            name = f"{p.nombre} {p.apellido}".lower()
            pacientes_map[name] = p.id

        for idx, row in df.iterrows():
            try:
                paciente_name = str(row[col_paciente]).strip()
                paciente_id = pacientes_map.get(paciente_name.lower())
                if not paciente_id:
                    # Create paciente if not exists - match app.py pattern
                    from app.services.pacientes import PacientesService
                    name_parts = paciente_name.split()
                    nombre = name_parts[0] if name_parts else "Sin nombre"
                    apellido = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Sin apellido"
                    paciente_dto = PacienteCreate(nombre=nombre, apellido=apellido)
                    paciente = PacientesService.create_paciente(db, paciente_dto, usuario_id)
                    paciente_id = paciente.id
                    pacientes_map[paciente_name.lower()] = paciente_id

                tratamiento_name = str(row[col_tratamiento]).strip()
                prestacion_usuario_id = prestaciones_map.get(tratamiento_name.lower())
                if not prestacion_usuario_id:
                    # Create prestacion_usuario if not exists
                    from app.services.prestaciones_usuario import PrestacionesUsuarioService
                    from app.models import Prestacion
                    prestacion_base = db.query(Prestacion).filter(Prestacion.nombre.ilike(f"%{tratamiento_name}%")).first()
                    if prestacion_base:
                        prestacion_dto = {"prestacion_id": prestacion_base.id}
                        prestacion = PrestacionesUsuarioService.create_prestacion_usuario(db, prestacion_dto, usuario_id)
                        prestacion_usuario_id = prestacion.id
                        prestaciones_map[tratamiento_name.lower()] = prestacion_usuario_id
                    else:
                        errores += 1
                        continue

                monto_str = str(row[col_monto])
                monto_ars = extraer_monto_numerico(monto_str)
                if monto_ars <= 0:
                    errores += 1
                    continue

                fecha_consulta = None
                if col_fecha:
                    fecha_str = str(row[col_fecha])
                    fecha_iso = normalizar_fecha_flexible(fecha_str)
                    from datetime import datetime
                    fecha_consulta = datetime.fromisoformat(fecha_iso).date()

                medio_pago = "efectivo"
                if col_medio_pago:
                    medio_str = str(row[col_medio_pago])
                    medio_pago = normalizar_medio_pago(medio_str)

                consulta_dto = ConsultaCreate(
                    paciente_id=paciente_id,
                    prestacion_usuario_id=prestacion_usuario_id,
                    fecha_consulta=fecha_consulta,
                    monto_ars=monto_ars,
                    medio_pago=medio_pago,
                )

                consulta = ConsultasService.create_consulta(db, consulta_dto, usuario_id)
                consultas_creadas.append(consulta)
                total_ars += monto_ars

            except Exception as e:
                print(f"❌ Error procesando fila {idx}: {str(e)}")
                errores += 1
                continue

        result = {
            "migrados": len(consultas_creadas),
            "errores": errores,
            "total_ars": round(total_ars, 0),
        }
        
        print(f"✅ Importación completada: {result}")
        return result
