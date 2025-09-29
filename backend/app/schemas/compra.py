from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class CompraCreate(BaseModel):
    insumo_basico_id: int
    cantidad: float = Field(..., gt=0)
    precio_total_ars: float = Field(..., gt=0)
    fecha_compra: date
    proveedor: Optional[str] = Field(None, max_length=150)
    lote: Optional[str] = Field(None, max_length=50)
    fecha_vencimiento: Optional[date] = None
    observaciones: Optional[str] = Field(None, max_length=1000)

    class Config:
        model_config = {"extra": "forbid"}


class CompraUpdate(BaseModel):
    insumo_basico_id: Optional[int] = None
    cantidad: Optional[float] = Field(None, gt=0)
    precio_total_ars: Optional[float] = Field(None, gt=0)
    fecha_compra: Optional[date] = None
    proveedor: Optional[str] = Field(None, max_length=150)
    lote: Optional[str] = Field(None, max_length=50)
    fecha_vencimiento: Optional[date] = None
    observaciones: Optional[str] = Field(None, max_length=1000)

    class Config:
        model_config = {"extra": "forbid"}


class CompraOut(BaseModel):
    id: int
    insumo_basico_id: int
    cantidad: float
    precio_total_ars: float
    fecha_compra: date
    proveedor: Optional[str]
    lote: Optional[str]
    fecha_vencimiento: Optional[date]
    observaciones: Optional[str]
    fecha_creacion: date

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
