from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class EquipoCreate(BaseModel):
    nombre_equipo: str = Field(..., max_length=150)
    monto_compra_usd: float = Field(..., gt=0)
    fecha_compra: date
    anios_vida_util: int = Field(..., gt=0, le=50)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = Field(None, max_length=1000)


class EquipoUpdate(BaseModel):
    nombre_equipo: Optional[str] = Field(None, max_length=150)
    monto_compra_usd: Optional[float] = Field(None, gt=0)
    fecha_compra: Optional[date] = None
    anios_vida_util: Optional[int] = Field(None, gt=0, le=50)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None

    class Config:
        model_config = {"extra": "forbid"}


class EquipoOut(BaseModel):
    id: int
    nombre_equipo: str
    monto_compra_usd: float
    fecha_compra: date
    anios_vida_util: int
    marca: Optional[str]
    modelo: Optional[str]
    observaciones: Optional[str]
    activo: bool
    fecha_creacion: datetime  # Changed from date to datetime to match model

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
