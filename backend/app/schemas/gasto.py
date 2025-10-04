from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class GastoCreate(BaseModel):
    concepto: str = Field(..., max_length=100)
    monto_mensual_ars: float = Field(..., ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)

    class Config:
        model_config = {"extra": "forbid"}


class GastoUpdate(BaseModel):
    concepto: Optional[str] = Field(None, max_length=100)
    monto_mensual_ars: Optional[float] = Field(None, ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None

    class Config:
        model_config = {"extra": "forbid"}


class GastoOut(BaseModel):
    id: int
    concepto: str
    monto_mensual_ars: float
    observaciones: Optional[str]
    activo: bool
    fecha_creacion: datetime  # Changed from date to datetime to match model
    fecha_actualizacion: datetime  # Changed from date to datetime to match model

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
