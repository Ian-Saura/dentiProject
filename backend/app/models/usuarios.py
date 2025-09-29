from __future__ import annotations

import enum
from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Especialidad(str, enum.Enum):
    odontologia = "odontologia"
    dermatologia = "dermatologia"
    kinesiologia = "kinesiologia"


class Plan(str, enum.Enum):
    trial = "trial"
    premium = "premium"
    enterprise = "enterprise"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[Optional[str]] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(150), unique=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    especialidad: Mapped[Especialidad] = mapped_column(Enum(Especialidad), nullable=False)
    plan: Mapped[Plan] = mapped_column(Enum(Plan), default=Plan.trial)
    fecha_vencimiento: Mapped[Optional[date]] = mapped_column(Date)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ultimo_acceso: Mapped[Optional[datetime]] = mapped_column(DateTime)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    pacientes: Mapped[List["Paciente"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    consultas: Mapped[List["Consulta"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    gastos_fijos: Mapped[List["GastoFijo"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    costos_equipos: Mapped[List["CostoEquipo"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    compras: Mapped[List["Compra"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    prestaciones_usuario: Mapped[List["PrestacionUsuario"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
    configuraciones: Mapped[List["ConfiguracionUsuario"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")


from app.models.pacientes import Paciente  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.consultas import Consulta  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.gastos_fijos import GastoFijo  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.costos_equipos import CostoEquipo  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.compras import Compra  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.prestaciones_usuario import PrestacionUsuario  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
from app.models.configuracion_usuario import ConfiguracionUsuario  # noqa: E402  # type: ignore  # pylint: disable=wrong-import-position
