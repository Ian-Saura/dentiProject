from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import PreciosService
from app.utils import validate_pagination_params

router = APIRouter(prefix="/precios", tags=["precios"])


@router.get("/")
def list_precios(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    codigo: str = Query(None),
    nombre: str = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if codigo:
        filtros["codigo"] = codigo
    if nombre:
        filtros["nombre"] = nombre

    precios, total = PreciosService.list_precios(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response.headers["X-Total-Count"] = str(total)
    return precios
