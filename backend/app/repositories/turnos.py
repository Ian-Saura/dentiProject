from __future__ import annotations

from typing import Dict, List, Optional
from datetime import date, time, datetime, timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models import Turno, ConfiguracionTurnos
from app.schemas.turnos import (
    TurnoCreate,
    TurnoUpdate,
    TurnoCreatePublic,
    ConfiguracionTurnosCreate,
    ConfiguracionTurnosUpdate,
)


# ==================== Turnos ====================

def list_turnos(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 100,
    offset: int = 0,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    estado: Optional[str] = None,
    paciente_id: Optional[int] = None,
) -> List[Turno]:
    """Lista turnos del profesional con filtros opcionales"""
    query = select(Turno).where(Turno.usuario_id == usuario_id)

    if fecha_desde:
        query = query.where(Turno.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.where(Turno.fecha <= fecha_hasta)
    if estado:
        query = query.where(Turno.estado == estado)
    if paciente_id:
        query = query.where(Turno.paciente_id == paciente_id)

    query = query.order_by(Turno.fecha, Turno.hora_inicio)
    query = query.limit(limit).offset(offset)
    
    return db.execute(query).scalars().all()


def count_turnos(
    db: Session,
    usuario_id: int,
    *,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    estado: Optional[str] = None,
    paciente_id: Optional[int] = None,
) -> int:
    """Cuenta turnos del profesional con filtros opcionales"""
    query = select(Turno).where(Turno.usuario_id == usuario_id)

    if fecha_desde:
        query = query.where(Turno.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.where(Turno.fecha <= fecha_hasta)
    if estado:
        query = query.where(Turno.estado == estado)
    if paciente_id:
        query = query.where(Turno.paciente_id == paciente_id)

    result = db.execute(query)
    return len(result.scalars().all())


def get_turno(db: Session, turno_id: int, usuario_id: int) -> Optional[Turno]:
    """Obtiene un turno específico del profesional"""
    query = select(Turno).where(
        Turno.id == turno_id,
        Turno.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def get_turno_by_token(db: Session, token: str) -> Optional[Turno]:
    """Obtiene un turno por su token de reserva (para acceso público)"""
    query = select(Turno).where(Turno.token_reserva == token)
    return db.execute(query).scalar_one_or_none()


def create_turno(db: Session, dto: TurnoCreate, usuario_id: int) -> Turno:
    """Crea un nuevo turno desde el panel del profesional"""
    # Calcular hora_fin
    hora_inicio_dt = datetime.combine(date.today(), dto.hora_inicio)
    hora_fin_dt = hora_inicio_dt + timedelta(minutes=dto.duracion_minutos)
    hora_fin = hora_fin_dt.time()

    turno_data = dto.model_dump()
    turno_data['hora_fin'] = hora_fin
    turno_data['usuario_id'] = usuario_id
    
    # Remover dni_paciente ya que no es columna de la tabla (solo se usa para buscar/crear paciente)
    turno_data.pop('dni_paciente', None)
    
    # Si tiene paciente_id, marcarlo como reservado
    if dto.paciente_id:
        turno_data['estado'] = 'reservado'
    
    turno = Turno(**turno_data)
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return turno


def create_turno_publico(db: Session, dto: TurnoCreatePublic, usuario_id: int, token: str) -> Turno:
    """Crea una reserva de turno desde el formulario público"""
    from app.models import Paciente
    
    # Calcular hora_fin
    hora_inicio_dt = datetime.combine(date.today(), dto.hora_inicio)
    hora_fin_dt = hora_inicio_dt + timedelta(minutes=dto.duracion_minutos)
    hora_fin = hora_fin_dt.time()

    # Buscar o crear paciente por DNI
    paciente_id = None
    if dto.dni_paciente:
        # Buscar paciente existente
        query = select(Paciente).where(
            Paciente.dni == dto.dni_paciente,
            Paciente.usuario_id == usuario_id
        )
        paciente_existente = db.execute(query).scalar_one_or_none()
        
        if paciente_existente:
            # Actualizar datos del paciente si es necesario
            paciente_existente.nombre = dto.nombre_paciente
            paciente_existente.apellido = dto.apellido_paciente
            if dto.telefono_paciente:
                paciente_existente.telefono = dto.telefono_paciente
            if dto.email_paciente:
                paciente_existente.email = dto.email_paciente
            db.commit()
            paciente_id = paciente_existente.id
        else:
            # Crear nuevo paciente
            nuevo_paciente = Paciente(
                usuario_id=usuario_id,
                nombre=dto.nombre_paciente,
                apellido=dto.apellido_paciente,
                dni=dto.dni_paciente,
                telefono=dto.telefono_paciente or '',
                email=dto.email_paciente,
                activo=True,
                fecha_registro=datetime.now()
            )
            db.add(nuevo_paciente)
            db.flush()  # Flush para obtener el ID
            paciente_id = nuevo_paciente.id

    turno = Turno(
        usuario_id=usuario_id,
        paciente_id=paciente_id,
        fecha=dto.fecha,
        hora_inicio=dto.hora_inicio,
        hora_fin=hora_fin,
        duracion_minutos=dto.duracion_minutos,
        estado='reservado',
        nombre_paciente=dto.nombre_paciente,
        apellido_paciente=dto.apellido_paciente,
        telefono_paciente=dto.telefono_paciente,
        email_paciente=dto.email_paciente,
        motivo_consulta=dto.motivo_consulta,
        token_reserva=token,
        creado_por_publico=True,
    )
    
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return turno


def update_turno(
    db: Session, turno_id: int, dto: TurnoUpdate, usuario_id: int
) -> Optional[Turno]:
    """Actualiza un turno existente"""
    turno = get_turno(db, turno_id, usuario_id)
    if not turno:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    
    # Si se actualiza la hora o duración, recalcular hora_fin
    if 'hora_inicio' in update_data or 'duracion_minutos' in update_data:
        hora_inicio = update_data.get('hora_inicio', turno.hora_inicio)
        duracion = update_data.get('duracion_minutos', turno.duracion_minutos)
        
        hora_inicio_dt = datetime.combine(date.today(), hora_inicio)
        hora_fin_dt = hora_inicio_dt + timedelta(minutes=duracion)
        update_data['hora_fin'] = hora_fin_dt.time()
    
    for field, value in update_data.items():
        setattr(turno, field, value)

    db.commit()
    db.refresh(turno)
    return turno


def delete_turno(db: Session, turno_id: int, usuario_id: int) -> bool:
    """Elimina un turno"""
    turno = get_turno(db, turno_id, usuario_id)
    if not turno:
        return False

    db.delete(turno)
    db.commit()
    return True


def cancelar_turno(db: Session, turno_id: int, usuario_id: int, motivo: Optional[str] = None) -> Optional[Turno]:
    """Cancela un turno"""
    turno = get_turno(db, turno_id, usuario_id)
    if not turno:
        return None
    
    turno.estado = 'cancelado'
    if motivo:
        if turno.observaciones:
            turno.observaciones += f"\n\nMotivo cancelación: {motivo}"
        else:
            turno.observaciones = f"Motivo cancelación: {motivo}"
    
    db.commit()
    db.refresh(turno)
    return turno


def confirmar_turno_paciente(db: Session, token: str) -> Optional[Turno]:
    """Confirma un turno por parte del paciente usando el token"""
    turno = get_turno_by_token(db, token)
    if not turno:
        return None
    
    turno.confirmado_por_paciente = True
    turno.estado = 'confirmado'
    
    db.commit()
    db.refresh(turno)
    return turno


def check_disponibilidad(
    db: Session,
    usuario_id: int,
    fecha: date,
    hora_inicio: time,
    duracion_minutos: int,
    excluir_turno_id: Optional[int] = None
) -> bool:
    """
    Verifica si un slot está disponible (no hay otro turno en ese horario)
    """
    hora_inicio_dt = datetime.combine(date.today(), hora_inicio)
    hora_fin_dt = hora_inicio_dt + timedelta(minutes=duracion_minutos)
    hora_fin = hora_fin_dt.time()
    
    query = select(Turno).where(
        Turno.usuario_id == usuario_id,
        Turno.fecha == fecha,
        Turno.estado.in_(['disponible', 'reservado', 'confirmado']),
        or_(
            # El nuevo turno empieza durante un turno existente
            and_(Turno.hora_inicio <= hora_inicio, Turno.hora_fin > hora_inicio),
            # El nuevo turno termina durante un turno existente
            and_(Turno.hora_inicio < hora_fin, Turno.hora_fin >= hora_fin),
            # El nuevo turno contiene completamente a un turno existente
            and_(Turno.hora_inicio >= hora_inicio, Turno.hora_fin <= hora_fin),
        )
    )
    
    if excluir_turno_id:
        query = query.where(Turno.id != excluir_turno_id)
    
    conflictos = db.execute(query).scalars().all()
    return len(conflictos) == 0


# ==================== Configuración de Turnos ====================

def get_configuracion_turnos(db: Session, usuario_id: int) -> Optional[ConfiguracionTurnos]:
    """Obtiene la configuración de turnos del profesional"""
    query = select(ConfiguracionTurnos).where(
        ConfiguracionTurnos.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_configuracion_turnos(
    db: Session, dto: ConfiguracionTurnosCreate, usuario_id: int
) -> ConfiguracionTurnos:
    """Crea la configuración de turnos del profesional"""
    config = ConfiguracionTurnos(**dto.model_dump(), usuario_id=usuario_id)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_configuracion_turnos(
    db: Session, dto: ConfiguracionTurnosUpdate, usuario_id: int
) -> Optional[ConfiguracionTurnos]:
    """Actualiza la configuración de turnos del profesional"""
    config = get_configuracion_turnos(db, usuario_id)
    if not config:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


def get_or_create_configuracion_turnos(
    db: Session, usuario_id: int
) -> ConfiguracionTurnos:
    """Obtiene o crea la configuración de turnos con valores por defecto"""
    config = get_configuracion_turnos(db, usuario_id)
    if not config:
        # Crear con valores por defecto
        default_config = ConfiguracionTurnosCreate(
            activo=False,  # Desactivado por defecto hasta que configure
            duraciones_permitidas=[15, 30, 45, 60],
            dias_anticipacion_min=1,
            dias_anticipacion_max=90,
            horarios_atencion={},
            dias_bloqueados=[],
            intervalo_descanso_minutos=0,
            permitir_superposicion=False,
        )
        config = create_configuracion_turnos(db, default_config, usuario_id)
    
    return config
