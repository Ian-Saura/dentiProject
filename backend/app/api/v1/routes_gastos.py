from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import GastoCreate, GastoOut, GastoUpdate
from app.services import GastosFijosService
from app.utils import validate_pagination_params

router = APIRouter(prefix="/gastos", tags=["gastos"])


@router.get("/", response_model=List[GastoOut])
def list_gastos(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    activo: bool = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if activo is not None:
        filtros["activo"] = activo

    gastos, total = GastosFijosService.list_gastos_fijos(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response.headers["X-Total-Count"] = str(total)
    return gastos


@router.post("/", response_model=GastoOut)
def create_gasto(
    gasto: GastoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return GastosFijosService.create_gasto_fijo(db, gasto, tenant.user_id)


@router.get("/{gasto_id}", response_model=GastoOut)
def get_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    gasto = GastosFijosService.get_gasto_fijo(db, gasto_id, tenant.user_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto not found")
    return gasto


@router.patch("/{gasto_id}", response_model=GastoOut)
def update_gasto(
    gasto_id: int,
    gasto: GastoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    updated = GastosFijosService.update_gasto_fijo(db, gasto_id, gasto, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Gasto not found")
    return updated


@router.delete("/{gasto_id}", status_code=204)
def delete_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not GastosFijosService.delete_gasto_fijo(db, gasto_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Gasto not found")
