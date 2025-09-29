from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DECIMAL, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PrestacionUsuario(Base):
    __tablename__ = "prestaciones_usuario"
    __table_args__ = (
        UniqueConstraint('usuario_id', 'prestacion_id', name='unique_usuario_prestacion'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    prestacion_id: Mapped[int] = mapped_column(Integer, ForeignKey("prestaciones.id", ondelete="RESTRICT"), nullable=False)
    nombre_personalizado: Mapped[Optional[str]] = mapped_column(String(150))
    tiempo_personal_min: Mapped[Optional[int]] = mapped_column(Integer)
    margen_ganancia_porcentaje: Mapped[float] = mapped_column(DECIMAL(5, 2), default=40.00)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    notas_personales: Mapped[Optional[str]] = mapped_column(String(1000))
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="prestaciones_usuario")
    prestacion: Mapped["Prestacion"] = relationship(back_populates="prestaciones_usuario")
    consultas: Mapped[List["Consulta"]] = relationship(back_populates="prestacion_usuario", cascade="all, delete-orphan")


from app.models.usuarios import Usuario  # noqa: E402
from app.models.prestaciones import Prestacion  # noqa: E402
from app.models.consultas import Consulta  # noqa: E402
