from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ConfigUsuarioCreate(BaseModel):
    costo_hora_calculado_ars: Optional[float] = Field(None, gt=0)
    costo_hora_manual_ars: Optional[float] = Field(None, gt=0)
    usar_costo_manual: bool = False
    horas_anuales_trabajadas: int = Field(1100, gt=0, le=3000)

    class Config:
        model_config = {"extra": "forbid"}


class ConfigUsuarioUpdate(BaseModel):
    costo_hora_calculado_ars: Optional[float] = Field(None, gt=0)
    costo_hora_manual_ars: Optional[float] = Field(None, gt=0)
    usar_costo_manual: Optional[bool] = None
    horas_anuales_trabajadas: Optional[int] = Field(None, gt=0, le=3000)

    class Config:
        model_config = {"extra": "forbid"}


class ConfigUsuarioOut(BaseModel):
    id: int
    costo_hora_calculado_ars: Optional[float]
    costo_hora_manual_ars: Optional[float]
    usar_costo_manual: bool
    horas_anuales_trabajadas: int
    fecha_creacion: datetime  # Changed from date to datetime to match model
    fecha_actualizacion: datetime  # Changed from date to datetime to match model

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
