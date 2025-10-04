from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TipoAccion(str, enum.Enum):
    """Tipos de acciones auditables"""
    # Autenticación
    login = "login"
    logout = "logout"
    registro = "registro"
    cambio_password = "cambio_password"
    
    # CRUD Operations
    crear = "crear"
    leer = "leer"
    actualizar = "actualizar"
    eliminar = "eliminar"
    
    # Acciones especiales
    importar = "importar"
    exportar = "exportar"
    calcular = "calcular"
    configurar = "configurar"


class EntidadTipo(str, enum.Enum):
    """Entidades del sistema"""
    usuario = "usuario"
    paciente = "paciente"
    consulta = "consulta"
    prestacion = "prestacion"
    gasto_fijo = "gasto_fijo"
    equipo = "equipo"
    compra = "compra"
    configuracion = "configuracion"
    insumo = "insumo"
    reporte = "reporte"


class Auditoria(Base):
    """
    Tabla de auditoría para tracking de todas las acciones de usuarios.
    Permite análisis data-driven y mejoras futuras basadas en uso real.
    """
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Usuario que realizó la acción
    usuario_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True  # Permite acciones anónimas (ej: intentos de login fallidos)
    )
    
    # Información de la acción
    accion: Mapped[TipoAccion] = mapped_column(Enum(TipoAccion), nullable=False)
    entidad_tipo: Mapped[Optional[EntidadTipo]] = mapped_column(Enum(EntidadTipo))
    entidad_id: Mapped[Optional[int]] = mapped_column(Integer)  # ID del registro afectado
    
    # Descripción y metadata
    descripcion: Mapped[Optional[str]] = mapped_column(String(500))
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON)  # Datos adicionales
    
    # Información técnica
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))  # IPv6 compatible
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    endpoint: Mapped[Optional[str]] = mapped_column(String(255))
    metodo_http: Mapped[Optional[str]] = mapped_column(String(10))
    
    # Información de resultado
    exitoso: Mapped[bool] = mapped_column(default=True)
    error_mensaje: Mapped[Optional[str]] = mapped_column(Text)
    
    # Timestamps
    fecha_hora: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    duracion_ms: Mapped[Optional[int]] = mapped_column(Integer)  # Tiempo de ejecución
    
    # Relación con usuario
    usuario: Mapped[Optional["Usuario"]] = relationship(back_populates="auditorias")


from app.models.usuarios import Usuario  # noqa: E402

