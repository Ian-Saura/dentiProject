from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import CostosService

router = APIRouter(prefix="/costos", tags=["costos"])


@router.get("/analisis")
def analisis_costos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return CostosService.analisis_costos(db, tenant.user_id)
