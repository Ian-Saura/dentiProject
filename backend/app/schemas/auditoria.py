from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AuditoriaBase(BaseModel):
    """Base schema para auditoría"""
    accion: str
    entidad_tipo: Optional[str] = None
    entidad_id: Optional[int] = None
    descripcion: Optional[str] = None
    metadata_json: Optional[dict] = None


class AuditoriaCreate(AuditoriaBase):
    """Crear registro de auditoría"""
    usuario_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    metodo_http: Optional[str] = None
    exitoso: bool = True
    error_mensaje: Optional[str] = None
    duracion_ms: Optional[int] = None


class AuditoriaResponse(AuditoriaBase):
    """Response de auditoría"""
    id: int
    usuario_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    endpoint: Optional[str]
    metodo_http: Optional[str]
    exitoso: bool
    error_mensaje: Optional[str]
    fecha_hora: datetime
    duracion_ms: Optional[int]
    
    class Config:
        from_attributes = True


class AuditoriaFilter(BaseModel):
    """Filtros para buscar auditoría"""
    usuario_id: Optional[int] = None
    accion: Optional[str] = None
    entidad_tipo: Optional[str] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
    exitoso: Optional[bool] = None
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class AnalyticsResponse(BaseModel):
    """Response de analytics"""
    total_acciones: int
    acciones_por_tipo: dict
    usuarios_activos: int
    acciones_exitosas: int
    acciones_fallidas: int
    promedio_duracion_ms: Optional[float]
    endpoints_mas_usados: list
    errores_comunes: list

