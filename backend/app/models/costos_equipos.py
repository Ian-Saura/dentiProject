from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import DECIMAL, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CostoEquipo(Base):
    __tablename__ = "costos_equipos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre_equipo: Mapped[str] = mapped_column(String(150), nullable=False)
    monto_compra_usd: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    fecha_compra: Mapped[date] = mapped_column(Date, nullable=False)
    anios_vida_util: Mapped[int] = mapped_column(Integer, nullable=False)
    marca: Mapped[Optional[str]] = mapped_column(String(100))
    modelo: Mapped[Optional[str]] = mapped_column(String(100))
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="costos_equipos")


from app.models.usuarios import Usuario  # noqa: E402
