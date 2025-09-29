from __future__ import annotations

import enum
from datetime import date
from typing import Optional

from pydantic import BaseModel


class CategoriaPrestacion(str, enum.Enum):
    diagnostico = "diagnostico"
    prevencion = "prevencion"
    operatoria = "operatoria"
    endodoncia = "endodoncia"
    cirugia = "cirugia"
    protesis = "protesis"
    ortodoncia = "ortodoncia"
    estetica = "estetica"


class ComplejidadPrestacion(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    muy_alta = "muy_alta"


class PrestacionOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    categoria: CategoriaPrestacion
    subcategoria: Optional[str]
    tiempo_estimado_min: int
    complejidad: ComplejidadPrestacion
    requiere_anestesia: bool
    requiere_radiografia: bool
    es_multisesion: bool
    activo: bool
    fecha_creacion: date

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
