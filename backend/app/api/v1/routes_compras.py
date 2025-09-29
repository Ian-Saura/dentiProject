from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import CompraCreate, CompraOut, CompraUpdate
from app.services import ComprasService
from app.utils import validate_pagination_params, add_total_count_header

router = APIRouter(prefix="/compras", tags=["compras"])


@router.get("/", response_model=List[CompraOut])
def list_compras(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    from_: str = Query(None, alias="from"),
    to: str = Query(None),
    insumo_q: str = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if from_:
        filtros["from"] = from_
    if to:
        filtros["to"] = to
    if insumo_q:
        filtros["insumo_q"] = insumo_q

    compras, total = ComprasService.list_compras(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response = compras
    return add_total_count_header(response, total)


@router.post("/", response_model=CompraOut)
def create_compra(
    compra: CompraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return ComprasService.create_compra(db, compra, tenant.user_id)


@router.get("/{compra_id}", response_model=CompraOut)
def get_compra(
    compra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    compra = ComprasService.get_compra(db, compra_id, tenant.user_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra not found")
    return compra


@router.patch("/{compra_id}", response_model=CompraOut)
def update_compra(
    compra_id: int,
    compra: CompraUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    updated = ComprasService.update_compra(db, compra_id, compra, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Compra not found")
    return updated


@router.delete("/{compra_id}", status_code=204)
def delete_compra(
    compra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not ComprasService.delete_compra(db, compra_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Compra not found")
