from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, validator


class MedioPago(str, enum.Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"
    debito = "debito"
    credito = "credito"
    mercadopago = "mercadopago"
    otro = "otro"


class EstadoConsulta(str, enum.Enum):
    completada = "completada"
    pendiente = "pendiente"
    cancelada = "cancelada"
    no_asistio = "no_asistio"


class ConsultaCreate(BaseModel):
    paciente_id: int
    prestacion_usuario_id: int
    fecha_consulta: date
    monto_ars: float = Field(..., gt=0)
    medio_pago: MedioPago
    pieza_dental: Optional[str] = Field(None, max_length=10)
    tiempo_real_minutos: Optional[int] = Field(None, gt=0)
    estado: EstadoConsulta = EstadoConsulta.completada
    proxima_cita: Optional[date] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    notas_privadas: Optional[str] = Field(None, max_length=1000)
    descuento_aplicado: float = Field(0.0, ge=0, le=100)

    class Config:
        model_config = {"extra": "forbid"}


class ConsultaUpdate(BaseModel):
    paciente_id: Optional[int] = None
    prestacion_usuario_id: Optional[int] = None
    fecha_consulta: Optional[date] = None
    monto_ars: Optional[float] = Field(None, gt=0)
    medio_pago: Optional[MedioPago] = None
    pieza_dental: Optional[str] = Field(None, max_length=10)
    tiempo_real_minutos: Optional[int] = Field(None, gt=0)
    estado: Optional[EstadoConsulta] = None
    proxima_cita: Optional[date] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    notas_privadas: Optional[str] = Field(None, max_length=1000)
    descuento_aplicado: Optional[float] = Field(None, ge=0, le=100)

    class Config:
        model_config = {"extra": "forbid"}


class ConsultaOut(BaseModel):
    id: int
    paciente_id: int
    prestacion_usuario_id: int
    fecha_consulta: date
    monto_ars: float
    medio_pago: MedioPago
    pieza_dental: Optional[str]
    tiempo_real_minutos: Optional[int]
    estado: EstadoConsulta
    proxima_cita: Optional[date]
    observaciones: Optional[str]
    notas_privadas: Optional[str]
    descuento_aplicado: float
    fecha_creacion: datetime  # Changed from date to datetime to match model

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
