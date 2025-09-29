from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/resumen")
def get_resumen(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return AnalyticsService.get_resumen(db, tenant.user_id)


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return AnalyticsService.get_kpis(db, tenant.user_id)
