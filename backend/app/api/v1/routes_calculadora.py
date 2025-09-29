from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import CalculadoraService

router = APIRouter(prefix="/calculadora", tags=["calculadora"])


@router.post("/recomendaciones")
def recomendaciones(
    tiempo_horas: float,
    costo_materiales_ars: float,
    usar_costo_real: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return CalculadoraService.recomendaciones(
        db, tenant.user_id, tiempo_horas, costo_materiales_ars, usar_costo_real
    )
