from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class CategoriaInsumo(str, enum.Enum):
    descartable = "descartable"
    farmaco = "farmaco"
    material_restaurador = "material_restaurador"
    instrumental = "instrumental"
    laboratorio = "laboratorio"
    radiologia = "radiologia"
    otros = "otros"


class UnidadMedida(str, enum.Enum):
    unidad = "unidad"
    ml = "ml"
    gr = "gr"
    cm = "cm"
    caja = "caja"
    blister = "blister"
    metro = "metro"


class InsumoOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    categoria: CategoriaInsumo
    unidad_medida: UnidadMedida
    marca_referencia: Optional[str]
    activo: bool
    fecha_creacion: datetime

    model_config = {"from_attributes": True}
