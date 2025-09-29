from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import DECIMAL, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Compra(Base):
    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    insumo_basico_id: Mapped[int] = mapped_column(Integer, ForeignKey("insumos_basicos.id", ondelete="RESTRICT"), nullable=False)
    cantidad: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    precio_total_ars: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    fecha_compra: Mapped[date] = mapped_column(Date, nullable=False)
    proveedor: Mapped[Optional[str]] = mapped_column(String(150))
    lote: Mapped[Optional[str]] = mapped_column(String(50))
    fecha_vencimiento: Mapped[Optional[date]] = mapped_column(Date)
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="compras")
    insumo_basico: Mapped["InsumoBasico"] = relationship(back_populates="compras")


from app.models.usuarios import Usuario  # noqa: E402
from app.models.insumos_basicos import InsumoBasico  # noqa: E402
