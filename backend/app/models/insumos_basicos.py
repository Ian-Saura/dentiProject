from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


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


class InsumoBasico(Base):
    __tablename__ = "insumos_basicos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    categoria: Mapped[CategoriaInsumo] = mapped_column(Enum(CategoriaInsumo), nullable=False)
    unidad_medida: Mapped[UnidadMedida] = mapped_column(Enum(UnidadMedida), nullable=False)
    marca_referencia: Mapped[Optional[str]] = mapped_column(String(100))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    prestaciones_insumos: Mapped[List["PrestacionInsumoBasico"]] = relationship(back_populates="insumo_basico", cascade="all, delete-orphan")
    compras: Mapped[List["Compra"]] = relationship(back_populates="insumo_basico", cascade="all, delete-orphan")


from app.models.prestaciones_insumos_basicos import PrestacionInsumoBasico  # noqa: E402
from app.models.compras import Compra  # noqa: E402
