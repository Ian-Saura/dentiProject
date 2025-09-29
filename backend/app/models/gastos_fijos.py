from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DECIMAL, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GastoFijo(Base):
    __tablename__ = "gastos_fijos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    concepto: Mapped[str] = mapped_column(String(100), nullable=False)
    monto_mensual_ars: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="gastos_fijos")


from app.models.usuarios import Usuario  # noqa: E402
