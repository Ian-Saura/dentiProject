from __future__ import annotations

from datetime import datetime

from sqlalchemy import DECIMAL, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PrestacionInsumoBasico(Base):
    __tablename__ = "prestaciones_insumos_basicos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prestacion_id: Mapped[int] = mapped_column(Integer, ForeignKey("prestaciones.id", ondelete="CASCADE"), nullable=False)
    insumo_basico_id: Mapped[int] = mapped_column(Integer, ForeignKey("insumos_basicos.id", ondelete="RESTRICT"), nullable=False)
    cantidad_estimada: Mapped[float] = mapped_column(DECIMAL(8, 3), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    prestacion: Mapped["Prestacion"] = relationship(back_populates="prestaciones_insumos")
    insumo_basico: Mapped["InsumoBasico"] = relationship(back_populates="prestaciones_insumos")


from app.models.prestaciones import Prestacion  # noqa: E402
from app.models.insumos_basicos import InsumoBasico  # noqa: E402
