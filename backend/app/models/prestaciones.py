from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


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


class Prestacion(Base):
    __tablename__ = "prestaciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    categoria: Mapped[CategoriaPrestacion] = mapped_column(Enum(CategoriaPrestacion), nullable=False)
    subcategoria: Mapped[Optional[str]] = mapped_column(String(50))
    tiempo_estimado_min: Mapped[int] = mapped_column(Integer, nullable=False)
    complejidad: Mapped[ComplejidadPrestacion] = mapped_column(Enum(ComplejidadPrestacion), default=ComplejidadPrestacion.media)
    requiere_anestesia: Mapped[bool] = mapped_column(Boolean, default=False)
    requiere_radiografia: Mapped[bool] = mapped_column(Boolean, default=False)
    es_multisesion: Mapped[bool] = mapped_column(Boolean, default=False)
    observaciones: Mapped[Optional[str]] = mapped_column(String(500))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    prestaciones_insumos: Mapped[List["PrestacionInsumoBasico"]] = relationship(back_populates="prestacion", cascade="all, delete-orphan")
    prestaciones_usuario: Mapped[List["PrestacionUsuario"]] = relationship(back_populates="prestacion", cascade="all, delete-orphan")


from app.models.prestaciones_insumos_basicos import PrestacionInsumoBasico  # noqa: E402
from app.models.prestaciones_usuario import PrestacionUsuario  # noqa: E402
