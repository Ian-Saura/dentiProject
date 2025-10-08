from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    dni: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    fecha_nacimiento: Mapped[Optional[datetime]] = mapped_column(Date)
    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(150))
    direccion: Mapped[Optional[str]] = mapped_column(String(500))
    obra_social: Mapped[Optional[str]] = mapped_column(String(100))
    numero_afiliado: Mapped[Optional[str]] = mapped_column(String(50))
    contacto_emergencia: Mapped[Optional[str]] = mapped_column(String(200))
    alergias: Mapped[Optional[str]] = mapped_column(String(1000))
    medicamentos_actuales: Mapped[Optional[str]] = mapped_column(String(1000))
    observaciones_medicas: Mapped[Optional[str]] = mapped_column(String(1000))
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="pacientes")
    consultas: Mapped[List["Consulta"]] = relationship(back_populates="paciente", cascade="all, delete-orphan")
    turnos: Mapped[List["Turno"]] = relationship(back_populates="paciente")


from app.models.usuarios import Usuario  # noqa: E402
from app.models.consultas import Consulta  # noqa: E402
from app.models.turnos import Turno  # noqa: E402
