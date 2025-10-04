from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import get_current_user
from app.models import Usuario
from app.schemas.auditoria import (
    AuditoriaResponse,
    AuditoriaFilter,
    AnalyticsResponse,
)
from app.services.auditoria import AuditoriaService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsResponse)
async def get_analytics_summary(
    dias: int = Query(30, ge=1, le=365, description="Días a analizar"),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtener resumen de analytics del sistema.
    Solo para administradores o usuarios premium.
    """
    # Verificar permisos (solo admin o premium)
    if current_user.plan not in ["premium", "enterprise"] and current_user.username != "admin":
        raise HTTPException(
            status_code=403,
            detail="Analytics only available for premium users"
        )
    
    analytics = AuditoriaService.get_analytics(db, dias=dias)
    return AnalyticsResponse(**analytics)


@router.get("/my-activity", response_model=List[AuditoriaResponse])
async def get_my_activity(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    accion: str | None = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener historial de actividad del usuario actual"""
    filters = AuditoriaFilter(
        usuario_id=current_user.id,
        accion=accion,
        limit=limit,
        offset=offset
    )
    
    audits, total = AuditoriaService.get_by_filters(db, filters)
    
    return [AuditoriaResponse.model_validate(audit) for audit in audits]


@router.get("/auditoria", response_model=dict)
async def get_auditoria(
    usuario_id: int | None = Query(None),
    accion: str | None = Query(None),
    entidad_tipo: str | None = Query(None),
    exitoso: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtener logs de auditoría con filtros.
    Solo para administradores.
    """
    # Solo admin puede ver toda la auditoría
    if current_user.username != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access full audit logs"
        )
    
    filters = AuditoriaFilter(
        usuario_id=usuario_id,
        accion=accion,
        entidad_tipo=entidad_tipo,
        exitoso=exitoso,
        limit=limit,
        offset=offset
    )
    
    audits, total = AuditoriaService.get_by_filters(db, filters)
    
    return {
        "items": [AuditoriaResponse.model_validate(audit) for audit in audits],
        "total": total,
        "limit": limit,
        "offset": offset
    }
