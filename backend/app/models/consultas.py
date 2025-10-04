from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Optional

from sqlalchemy import DECIMAL, Boolean, Date, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MedioPago(str, enum.Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"
    debito = "debito"
    credito = "credito"
    mercadopago = "mercadopago"
    otro = "otro"


class EstadoConsulta(str, enum.Enum):
    completada = "completada"
    pendiente = "pendiente"
    cancelada = "cancelada"
    no_asistio = "no_asistio"


class Consulta(Base):
    __tablename__ = "consultas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(Integer, ForeignKey("pacientes.id", ondelete="RESTRICT"), nullable=False)
    prestacion_usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("prestaciones_usuario.id", ondelete="RESTRICT"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    fecha_consulta: Mapped[date] = mapped_column(Date, nullable=False)
    monto_ars: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    medio_pago: Mapped[MedioPago] = mapped_column(Enum(MedioPago), nullable=False)
    pieza_dental: Mapped[Optional[str]] = mapped_column(String(10))
    tiempo_real_minutos: Mapped[Optional[int]] = mapped_column(Integer)
    estado: Mapped[EstadoConsulta] = mapped_column(Enum(EstadoConsulta), default=EstadoConsulta.completada)
    proxima_cita: Mapped[Optional[date]] = mapped_column(Date)
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    notas_privadas: Mapped[Optional[str]] = mapped_column(String(1000))
    descuento_aplicado: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0.00)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    paciente: Mapped["Paciente"] = relationship(back_populates="consultas")
    prestacion_usuario: Mapped["PrestacionUsuario"] = relationship(back_populates="consultas")
    usuario: Mapped["Usuario"] = relationship(back_populates="consultas")


from datetime import datetime  # noqa: E402
from app.models.pacientes import Paciente  # noqa: E402
from app.models.prestaciones_usuario import PrestacionUsuario  # noqa: E402
from app.models.usuarios import Usuario  # noqa: E402
