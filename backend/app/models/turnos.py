from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, JSON, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EstadoTurno(str, enum.Enum):
    disponible = "disponible"
    reservado = "reservado"
    confirmado = "confirmado"
    cancelado = "cancelado"
    completado = "completado"
    no_asistio = "no_asistio"


class DuracionTurno(int, enum.Enum):
    quince = 15
    treinta = 30
    cuarenta_cinco = 45
    sesenta = 60


class DiaSemana(int, enum.Enum):
    lunes = 0
    martes = 1
    miercoles = 2
    jueves = 3
    viernes = 4
    sabado = 5
    domingo = 6


class Turno(Base):
    __tablename__ = "turnos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    paciente_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("pacientes.id", ondelete="SET NULL"))
    
    # Datos del turno
    fecha: Mapped[datetime] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[datetime] = mapped_column(Time, nullable=False)
    hora_fin: Mapped[datetime] = mapped_column(Time, nullable=False)
    duracion_minutos: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Estado y confirmación
    estado: Mapped[EstadoTurno] = mapped_column(Enum(EstadoTurno), default=EstadoTurno.disponible)
    
    # Información del paciente (para reservas públicas sin paciente registrado)
    nombre_paciente: Mapped[Optional[str]] = mapped_column(String(100))
    apellido_paciente: Mapped[Optional[str]] = mapped_column(String(100))
    telefono_paciente: Mapped[Optional[str]] = mapped_column(String(20))
    email_paciente: Mapped[Optional[str]] = mapped_column(String(150))
    
    # Motivo y observaciones
    motivo_consulta: Mapped[Optional[str]] = mapped_column(String(500))
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    notas_profesional: Mapped[Optional[str]] = mapped_column(String(1000))
    
    # Token único para gestionar la reserva
    token_reserva: Mapped[Optional[str]] = mapped_column(String(64), unique=True, index=True)
    
    # Metadatos
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_modificacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creado_por_publico: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Recordatorios
    recordatorio_enviado: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmado_por_paciente: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    usuario: Mapped["Usuario"] = relationship(back_populates="turnos")
    paciente: Mapped[Optional["Paciente"]] = relationship(back_populates="turnos")


class ConfiguracionTurnos(Base):
    __tablename__ = "configuracion_turnos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Configuración general
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    duraciones_permitidas: Mapped[list] = mapped_column(JSON, default=[15, 30, 45, 60])
    dias_anticipacion_min: Mapped[int] = mapped_column(Integer, default=1)  # Días mínimos de anticipación
    dias_anticipacion_max: Mapped[int] = mapped_column(Integer, default=90)  # Días máximos de anticipación
    
    # Rango horario general (para mostrar slots en calendario)
    hora_inicio_dia: Mapped[Optional[str]] = mapped_column(String(5), default="08:00")  # HH:MM
    hora_fin_dia: Mapped[Optional[str]] = mapped_column(String(5), default="20:00")  # HH:MM
    
    # Link único para reservas públicas
    link_reserva_unico: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)
    
    # Horarios por día de la semana (JSON con estructura)
    # Formato: {"0": [{"inicio": "09:00", "fin": "13:00"}, {"inicio": "14:00", "fin": "18:00"}], ...}
    horarios_atencion: Mapped[dict] = mapped_column(JSON, default={})
    
    # Días no laborables (feriados, vacaciones)
    # Formato: ["2024-01-01", "2024-12-25"]
    dias_bloqueados: Mapped[list] = mapped_column(JSON, default=[])
    
    # Configuración de turnos
    intervalo_descanso_minutos: Mapped[int] = mapped_column(Integer, default=0)  # Descanso entre turnos
    permitir_superposicion: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Textos personalizables
    mensaje_bienvenida: Mapped[Optional[str]] = mapped_column(String(500))
    mensaje_confirmacion: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Metadatos
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_modificacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    usuario: Mapped["Usuario"] = relationship(back_populates="configuracion_turnos")


from app.models.usuarios import Usuario  # noqa: E402
from app.models.pacientes import Paciente  # noqa: E402
