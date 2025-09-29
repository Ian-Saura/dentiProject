from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import EquipoCreate, EquipoOut, EquipoUpdate
from app.services import CostosEquiposService
from app.utils import validate_pagination_params, add_total_count_header

router = APIRouter(prefix="/equipos", tags=["equipos"])


@router.get("/", response_model=List[EquipoOut])
def list_equipos(
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

    equipos, total = CostosEquiposService.list_costos_equipos(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response = equipos
    return add_total_count_header(response, total)


@router.post("/", response_model=EquipoOut)
def create_equipo(
    equipo: EquipoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return CostosEquiposService.create_costo_equipo(db, equipo, tenant.user_id)


@router.get("/{equipo_id}", response_model=EquipoOut)
def get_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    equipo = CostosEquiposService.get_costo_equipo(db, equipo_id, tenant.user_id)
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo not found")
    return equipo


@router.patch("/{equipo_id}", response_model=EquipoOut)
def update_equipo(
    equipo_id: int,
    equipo: EquipoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    updated = CostosEquiposService.update_costo_equipo(db, equipo_id, equipo, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Equipo not found")
    return updated


@router.delete("/{equipo_id}", status_code=204)
def delete_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not CostosEquiposService.delete_costo_equipo(db, equipo_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Equipo not found")
