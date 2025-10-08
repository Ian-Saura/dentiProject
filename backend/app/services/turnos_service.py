from __future__ import annotations

import secrets
from typing import List, Optional
from datetime import date, time, datetime, timedelta

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.turnos import EstadoTurno
from app.models import Paciente
from app.schemas.turnos import (
    SlotDisponible,
    DisponibilidadResponse,
    LinkTurnoResponse,
)
from app.repositories import turnos as turnos_repo


class TurnosService:
    """Servicio para lógica de negocio de turnos"""

    @staticmethod
    def generar_token_reserva() -> str:
        """Genera un token único para reservas públicas"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def obtener_slots_disponibles(
        db: Session,
        usuario_id: int,
        fecha_desde: date,
        fecha_hasta: date,
        duracion_minutos: int,
    ) -> DisponibilidadResponse:
        """
        Genera los slots disponibles para un rango de fechas y duración específica
        """
        # Obtener configuración del profesional
        config = turnos_repo.get_configuracion_turnos(db, usuario_id)
        
        if not config or not config.activo:
            return DisponibilidadResponse(slots=[], total=0)
        
        # Verificar que la duración está permitida
        if duracion_minutos not in config.duraciones_permitidas:
            raise HTTPException(
                status_code=400,
                detail=f"Duración no permitida. Duraciones disponibles: {config.duraciones_permitidas}"
            )
        
        # Verificar límites de anticipación
        hoy = date.today()
        min_fecha = hoy + timedelta(days=config.dias_anticipacion_min)
        max_fecha = hoy + timedelta(days=config.dias_anticipacion_max)
        
        if fecha_desde < min_fecha:
            fecha_desde = min_fecha
        if fecha_hasta > max_fecha:
            fecha_hasta = max_fecha
        
        slots = []
        current_date = fecha_desde
        
        while current_date <= fecha_hasta:
            # Verificar si es un día bloqueado
            if str(current_date) in config.dias_bloqueados:
                current_date += timedelta(days=1)
                continue
            
            # Obtener día de la semana (0 = lunes, 6 = domingo)
            dia_semana = str(current_date.weekday())
            
            # Verificar si hay horarios configurados para este día
            if dia_semana not in config.horarios_atencion:
                current_date += timedelta(days=1)
                continue
            
            horarios_dia = config.horarios_atencion[dia_semana]
            
            # Para cada bloque horario del día
            for horario in horarios_dia:
                hora_inicio_str = horario.get('inicio')
                hora_fin_str = horario.get('fin')
                
                if not hora_inicio_str or not hora_fin_str:
                    continue
                
                # Convertir strings a time
                hora_actual = datetime.strptime(hora_inicio_str, "%H:%M").time()
                hora_fin_bloque = datetime.strptime(hora_fin_str, "%H:%M").time()
                
                # Generar slots dentro de este bloque
                while True:
                    hora_actual_dt = datetime.combine(date.today(), hora_actual)
                    hora_fin_slot_dt = hora_actual_dt + timedelta(minutes=duracion_minutos)
                    hora_fin_slot = hora_fin_slot_dt.time()
                    
                    # Si el slot se pasa del horario de atención, parar
                    if hora_fin_slot > hora_fin_bloque:
                        break
                    
                    # Verificar disponibilidad (que no haya otro turno)
                    disponible = turnos_repo.check_disponibilidad(
                        db=db,
                        usuario_id=usuario_id,
                        fecha=current_date,
                        hora_inicio=hora_actual,
                        duracion_minutos=duracion_minutos
                    )
                    
                    if disponible:
                        slots.append(SlotDisponible(
                            fecha=current_date,
                            hora_inicio=hora_actual,
                            hora_fin=hora_fin_slot,
                            duracion_minutos=duracion_minutos
                        ))
                    
                    # Avanzar al siguiente slot (duración + descanso)
                    siguiente_slot_dt = hora_actual_dt + timedelta(
                        minutes=duracion_minutos + config.intervalo_descanso_minutos
                    )
                    hora_actual = siguiente_slot_dt.time()
            
            current_date += timedelta(days=1)
        
        return DisponibilidadResponse(
            slots=slots,
            total=len(slots)
        )

    @staticmethod
    def obtener_slots_disponibles_dia(
        db: Session,
        usuario_id: int,
        fecha: date,
        duracion_minutos: int,
    ) -> DisponibilidadResponse:
        """
        Obtiene los slots disponibles para un día específico
        """
        return TurnosService.obtener_slots_disponibles(
            db=db,
            usuario_id=usuario_id,
            fecha_desde=fecha,
            fecha_hasta=fecha,
            duracion_minutos=duracion_minutos
        )

    @staticmethod
    def generar_link_reserva(
        db: Session,
        usuario_id: int,
        duracion_minutos: int,
        base_url: str
    ) -> LinkTurnoResponse:
        """
        Genera un link público para que pacientes reserven turnos
        """
        # Verificar que el profesional tenga configuración activa
        config = turnos_repo.get_or_create_configuracion_turnos(db, usuario_id)
        
        if not config.activo:
            raise HTTPException(
                status_code=400,
                detail="Debe activar la configuración de turnos antes de generar links"
            )
        
        if duracion_minutos not in config.duraciones_permitidas:
            raise HTTPException(
                status_code=400,
                detail=f"Duración no permitida. Duraciones disponibles: {config.duraciones_permitidas}"
            )
        
        # Generar URL
        url = f"{base_url}/reservar-turno/{usuario_id}?duracion={duracion_minutos}"
        
        return LinkTurnoResponse(
            url=url,
            duracion_minutos=duracion_minutos,
            activo=config.activo,
            mensaje_bienvenida=config.mensaje_bienvenida
        )

    @staticmethod
    def validar_turno_publico(
        db: Session,
        usuario_id: int,
        fecha: date,
        hora_inicio: time,
        duracion_minutos: int,
    ) -> bool:
        """
        Valida que un turno pueda ser reservado desde el formulario público
        """
        # Obtener configuración
        config = turnos_repo.get_configuracion_turnos(db, usuario_id)
        
        if not config or not config.activo:
            raise HTTPException(
                status_code=400,
                detail="Las reservas de turnos no están disponibles en este momento"
            )
        
        # Verificar duración permitida
        if duracion_minutos not in config.duraciones_permitidas:
            raise HTTPException(
                status_code=400,
                detail=f"Duración no permitida"
            )
        
        # Verificar anticipación
        hoy = date.today()
        min_fecha = hoy + timedelta(days=config.dias_anticipacion_min)
        max_fecha = hoy + timedelta(days=config.dias_anticipacion_max)
        
        if fecha < min_fecha:
            raise HTTPException(
                status_code=400,
                detail=f"Debe reservar con al menos {config.dias_anticipacion_min} día(s) de anticipación"
            )
        
        if fecha > max_fecha:
            raise HTTPException(
                status_code=400,
                detail=f"No puede reservar con más de {config.dias_anticipacion_max} días de anticipación"
            )
        
        # Verificar día bloqueado
        if str(fecha) in config.dias_bloqueados:
            raise HTTPException(
                status_code=400,
                detail="El día seleccionado no está disponible"
            )
        
        # Verificar horario de atención
        dia_semana = str(fecha.weekday())
        if dia_semana not in config.horarios_atencion:
            raise HTTPException(
                status_code=400,
                detail="No hay atención en el día seleccionado"
            )
        
        # Verificar que el horario está dentro de los bloques de atención
        hora_inicio_dt = datetime.combine(date.today(), hora_inicio)
        hora_fin_dt = hora_inicio_dt + timedelta(minutes=duracion_minutos)
        hora_fin = hora_fin_dt.time()
        
        horarios_dia = config.horarios_atencion[dia_semana]
        horario_valido = False
        
        for horario in horarios_dia:
            hora_inicio_bloque = datetime.strptime(horario['inicio'], "%H:%M").time()
            hora_fin_bloque = datetime.strptime(horario['fin'], "%H:%M").time()
            
            if hora_inicio >= hora_inicio_bloque and hora_fin <= hora_fin_bloque:
                horario_valido = True
                break
        
        if not horario_valido:
            raise HTTPException(
                status_code=400,
                detail="El horario seleccionado está fuera del horario de atención"
            )
        
        # Verificar disponibilidad (que no haya conflictos)
        disponible = turnos_repo.check_disponibilidad(
            db=db,
            usuario_id=usuario_id,
            fecha=fecha,
            hora_inicio=hora_inicio,
            duracion_minutos=duracion_minutos
        )
        
        if not disponible:
            raise HTTPException(
                status_code=400,
                detail="El horario seleccionado ya no está disponible"
            )
        
        return True

    @staticmethod
    def get_estadisticas_turnos(
        db: Session,
        usuario_id: int,
        mes: int,
        anio: int
    ) -> dict:
        """
        Obtiene estadísticas de turnos para un mes específico
        """
        fecha_desde = date(anio, mes, 1)
        
        # Calcular último día del mes
        if mes == 12:
            fecha_hasta = date(anio + 1, 1, 1) - timedelta(days=1)
        else:
            fecha_hasta = date(anio, mes + 1, 1) - timedelta(days=1)
        
        turnos = turnos_repo.list_turnos(
            db=db,
            usuario_id=usuario_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            limit=1000
        )
        
        # Calcular estadísticas
        total = len(turnos)
        confirmados = len([t for t in turnos if t.estado == EstadoTurno.confirmado])
        completados = len([t for t in turnos if t.estado == EstadoTurno.completado])
        cancelados = len([t for t in turnos if t.estado == EstadoTurno.cancelado])
        no_asistio = len([t for t in turnos if t.estado == EstadoTurno.no_asistio])
        pendientes = len([t for t in turnos if t.estado == EstadoTurno.reservado])
        
        return {
            "mes": mes,
            "anio": anio,
            "total": total,
            "confirmados": confirmados,
            "completados": completados,
            "cancelados": cancelados,
            "no_asistio": no_asistio,
            "pendientes": pendientes,
            "tasa_asistencia": round((completados / total * 100) if total > 0 else 0, 2),
            "tasa_cancelacion": round((cancelados / total * 100) if total > 0 else 0, 2),
        }
    
    @staticmethod
    def buscar_o_crear_paciente(
        db: Session,
        usuario_id: int,
        dni: str,
        nombre: str,
        apellido: str,
        telefono: Optional[str] = None,
        email: Optional[str] = None
    ) -> Paciente:
        """
        Busca un paciente por DNI. Si no existe, lo crea.
        Esto permite vincular automáticamente turnos con pacientes existentes.
        """
        # Buscar paciente existente por DNI
        paciente = db.query(Paciente).filter(
            Paciente.usuario_id == usuario_id,
            Paciente.dni == dni
        ).first()
        
        if paciente:
            # Actualizar datos si es necesario
            if nombre and not paciente.nombre:
                paciente.nombre = nombre
            if apellido and not paciente.apellido:
                paciente.apellido = apellido
            if telefono and not paciente.telefono:
                paciente.telefono = telefono
            if email and not paciente.email:
                paciente.email = email
            db.commit()
            db.refresh(paciente)
            return paciente
        
        # Crear nuevo paciente
        nuevo_paciente = Paciente(
            usuario_id=usuario_id,
            dni=dni,
            nombre=nombre,
            apellido=apellido,
            telefono=telefono,
            email=email
        )
        db.add(nuevo_paciente)
        db.commit()
        db.refresh(nuevo_paciente)
        return nuevo_paciente
