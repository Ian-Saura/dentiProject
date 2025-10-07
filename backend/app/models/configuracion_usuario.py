from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DECIMAL, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConfiguracionUsuario(Base):
    __tablename__ = "configuracion_usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    costo_hora_calculado_ars: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    costo_hora_manual_ars: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    usar_costo_manual: Mapped[bool] = mapped_column(Boolean, default=False)
    horas_anuales_trabajadas: Mapped[int] = mapped_column(Integer, default=1100)
    tipo_cambio_usd_ars: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), default=1335)
    margen_ganancia_porcentaje: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2), default=40)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="configuraciones")


from app.models.usuarios import Usuario  # noqa: E402
