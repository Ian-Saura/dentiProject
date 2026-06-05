from __future__ import annotations

from datetime import date, time, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator

from app.models.turnos import EstadoTurno, DuracionTurno


# ==================== Configuración de Turnos ====================

class HorarioAtencion(BaseModel):
    inicio: str = Field(..., description="Hora de inicio en formato HH:MM", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    fin: str = Field(..., description="Hora de fin en formato HH:MM", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")


class ConfiguracionTurnosBase(BaseModel):
    activo: bool = True
    duraciones_permitidas: List[int] = Field(default=[15, 30, 45, 60])
    dias_anticipacion_min: int = Field(default=1, ge=0)
    dias_anticipacion_max: int = Field(default=90, ge=1)
    hora_inicio_dia: str = Field(default="08:00", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    hora_fin_dia: str = Field(default="20:00", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    link_reserva_unico: Optional[str] = Field(None, max_length=50)
    horarios_atencion: Dict[str, List[HorarioAtencion]] = Field(default={})
    dias_bloqueados: List[str] = Field(default=[])
    intervalo_descanso_minutos: int = Field(default=0, ge=0)
    permitir_superposicion: bool = False
    mensaje_bienvenida: Optional[str] = None
    mensaje_confirmacion: Optional[str] = None


class ConfiguracionTurnosCreate(ConfiguracionTurnosBase):
    pass


class ConfiguracionTurnosUpdate(BaseModel):
    activo: Optional[bool] = None
    duraciones_permitidas: Optional[List[int]] = None
    dias_anticipacion_min: Optional[int] = None
    dias_anticipacion_max: Optional[int] = None
    hora_inicio_dia: Optional[str] = Field(None, pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    hora_fin_dia: Optional[str] = Field(None, pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    link_reserva_unico: Optional[str] = Field(None, max_length=50)
    horarios_atencion: Optional[Dict[str, List[HorarioAtencion]]] = None
    dias_bloqueados: Optional[List[str]] = None
    intervalo_descanso_minutos: Optional[int] = None
    permitir_superposicion: Optional[bool] = None
    mensaje_bienvenida: Optional[str] = None
    mensaje_confirmacion: Optional[str] = None


class ConfiguracionTurnosResponse(ConfiguracionTurnosBase):
    id: int
    usuario_id: int
    fecha_creacion: datetime
    fecha_modificacion: datetime

    class Config:
        from_attributes = True


# ==================== Turnos ====================

class TurnoBase(BaseModel):
    fecha: date
    hora_inicio: time
    duracion_minutos: int = Field(..., ge=15, le=120)
    motivo_consulta: Optional[str] = None
    observaciones: Optional[str] = None


class TurnoCreate(TurnoBase):
    """Schema para crear un turno desde el panel de profesional"""
    paciente_id: Optional[int] = None
    nombre_paciente: Optional[str] = None
    apellido_paciente: Optional[str] = None
    dni_paciente: Optional[str] = None  # DNI para buscar/crear paciente
    telefono_paciente: Optional[str] = None
    email_paciente: Optional[str] = None
    

class TurnoCreatePublic(BaseModel):
    """Schema para reserva pública de turno"""
    fecha: date
    hora_inicio: time
    duracion_minutos: int
    nombre_paciente: str = Field(..., min_length=1, max_length=100)
    apellido_paciente: str = Field(..., min_length=1, max_length=100)
    dni_paciente: str = Field(..., min_length=7, max_length=20, description="DNI obligatorio")
    telefono_paciente: str = Field(..., min_length=1, max_length=20)
    email_paciente: Optional[str] = Field(None, max_length=150)
    motivo_consulta: Optional[str] = Field(None, max_length=500)


class TurnoUpdate(BaseModel):
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    duracion_minutos: Optional[int] = None
    estado: Optional[EstadoTurno] = None
    paciente_id: Optional[int] = None
    nombre_paciente: Optional[str] = None
    apellido_paciente: Optional[str] = None
    dni_paciente: Optional[str] = None
    telefono_paciente: Optional[str] = None
    email_paciente: Optional[str] = None
    motivo_consulta: Optional[str] = None
    observaciones: Optional[str] = None
    notas_profesional: Optional[str] = None
    confirmado_por_paciente: Optional[bool] = None


class TurnoResponse(TurnoBase):
    id: int
    usuario_id: int
    paciente_id: Optional[int] = None
    hora_fin: time
    estado: EstadoTurno
    nombre_paciente: Optional[str] = None
    apellido_paciente: Optional[str] = None
    dni_paciente: Optional[str] = None
    telefono_paciente: Optional[str] = None
    email_paciente: Optional[str] = None
    notas_profesional: Optional[str] = None
    token_reserva: Optional[str] = None
    fecha_creacion: datetime
    fecha_modificacion: datetime
    creado_por_publico: bool
    recordatorio_enviado: bool
    confirmado_por_paciente: bool

    class Config:
        from_attributes = True


class TurnoResponsePublic(BaseModel):
    """Respuesta pública limitada para pacientes"""
    id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    duracion_minutos: int
    estado: EstadoTurno
    nombre_paciente: str
    apellido_paciente: str
    confirmado_por_paciente: bool
    token_reserva: str

    class Config:
        from_attributes = True


# ==================== Disponibilidad ====================

class SlotDisponible(BaseModel):
    """Representa un slot de tiempo disponible para reservar"""
    fecha: date
    hora_inicio: time
    hora_fin: time
    duracion_minutos: int


class DisponibilidadResponse(BaseModel):
    """Respuesta con slots disponibles para una fecha o rango"""
    slots: List[SlotDisponible]
    total: int


# ==================== Links compartibles ====================

class LinkTurnoBase(BaseModel):
    """Base schema for booking links"""
    duracion_minutos: int = Field(..., ge=15, le=120)
    mensaje_personalizado: Optional[str] = Field(None, max_length=500)


class LinkTurnoCreate(LinkTurnoBase):
    """Schema to create a new booking link"""
    pass


class LinkTurnoUpdate(BaseModel):
    """Schema to update a booking link"""
    activo: Optional[bool] = None
    mensaje_personalizado: Optional[str] = None


class LinkTurnoResponse(BaseModel):
    """Information about a booking link"""
    id: int
    token: str
    url: str
    duracion_minutos: int
    activo: bool
    mensaje_personalizado: Optional[str] = None
    usos_totales: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True


class LinkTurnoPublicResponse(BaseModel):
    """Public information about a booking link (for patients)"""
    duracion_minutos: int
    mensaje_personalizado: Optional[str] = None
    activo: bool
    nombre_profesional: str
    especialidad: str


class GenerarLinkRequest(BaseModel):
    duracion_minutos: int = Field(..., description="Duración del turno en minutos")
    mensaje_personalizado: Optional[str] = Field(None, max_length=500)
    

# ==================== Confirmación ====================

class ConfirmarTurnoRequest(BaseModel):
    confirmar: bool = True


class CancelarTurnoRequest(BaseModel):
    motivo: Optional[str] = None
