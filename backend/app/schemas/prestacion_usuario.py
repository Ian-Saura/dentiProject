from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PrestacionUsuarioCreate(BaseModel):
    model_config = {"extra": "forbid"}

    prestacion_id: int
    nombre_personalizado: Optional[str] = Field(None, max_length=150)
    tiempo_personal_min: Optional[int] = Field(None, gt=0)
    margen_ganancia_porcentaje: float = Field(40.0, ge=0, le=300)
    notas_personales: Optional[str] = Field(None, max_length=1000)


class PrestacionUsuarioUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    nombre_personalizado: Optional[str] = Field(None, max_length=150)
    tiempo_personal_min: Optional[int] = Field(None, gt=0)
    margen_ganancia_porcentaje: Optional[float] = Field(None, ge=0, le=300)
    notas_personales: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None


class PrestacionUsuarioOut(BaseModel):
    id: int
    prestacion_id: int
    nombre_personalizado: Optional[str]
    tiempo_personal_min: Optional[int]
    margen_ganancia_porcentaje: float
    activo: bool
    notas_personales: Optional[str]
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = {"from_attributes": True}
