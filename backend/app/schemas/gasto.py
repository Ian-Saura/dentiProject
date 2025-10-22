from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class MonedaGasto(str, enum.Enum):
    ARS = "ARS"
    USD = "USD"


class GastoCreate(BaseModel):
    concepto: str = Field(..., max_length=100)
    monto_mensual: float = Field(..., ge=0)
    moneda: MonedaGasto = Field(default=MonedaGasto.ARS)
    observaciones: Optional[str] = Field(None, max_length=1000)


class GastoUpdate(BaseModel):
    concepto: Optional[str] = Field(None, max_length=100)
    monto_mensual: Optional[float] = Field(None, ge=0)
    moneda: Optional[MonedaGasto] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None

    class Config:
        model_config = {"extra": "forbid"}


class GastoOut(BaseModel):
    id: int
    concepto: str
    monto_mensual: float
    moneda: MonedaGasto
    monto_mensual_ars: Optional[float]  # Calculated field for compatibility
    observaciones: Optional[str]
    activo: bool
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
