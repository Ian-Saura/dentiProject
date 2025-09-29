from __future__ import annotations

from typing import Optional

from sqlalchemy import DECIMAL, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VPrestacionPrecio(Base):
    """Read-only view for v_prestaciones_precios."""

    __tablename__ = "v_prestaciones_precios"

    prestacion_usuario_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(Integer)
    profesional: Mapped[str] = mapped_column(String(201))
    codigo: Mapped[str] = mapped_column(String(20))
    nombre_prestacion: Mapped[str] = mapped_column(String(150))
    tiempo_min: Mapped[int] = mapped_column(Integer)
    margen_ganancia_porcentaje: Mapped[float] = mapped_column(DECIMAL(5, 2))
    costo_insumos_estimado: Mapped[float] = mapped_column(DECIMAL(28, 2))
