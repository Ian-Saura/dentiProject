from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import PrestacionUsuarioCreate, PrestacionUsuarioOut, PrestacionUsuarioUpdate
from app.services import PrestacionesUsuarioService
from app.utils import validate_pagination_params

router = APIRouter(prefix="/prestaciones-usuario", tags=["prestaciones-usuario"])


@router.get("/", response_model=List[PrestacionUsuarioOut])
def list_prestaciones_usuario(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    q: str = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if q:
        filtros["q"] = q

    prestaciones, total = PrestacionesUsuarioService.list_prestaciones_usuario(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response.headers["X-Total-Count"] = str(total)
    return prestaciones


@router.post("/", response_model=PrestacionUsuarioOut)
def create_prestacion_usuario(
    prestacion: PrestacionUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return PrestacionesUsuarioService.create_prestacion_usuario(db, prestacion, tenant.user_id)


@router.get("/{prestacion_id}", response_model=PrestacionUsuarioOut)
def get_prestacion_usuario(
    prestacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    prestacion = PrestacionesUsuarioService.get_prestacion_usuario(db, prestacion_id, tenant.user_id)
    if not prestacion:
        raise HTTPException(status_code=404, detail="PrestacionUsuario not found")
    return prestacion


@router.patch("/{prestacion_id}", response_model=PrestacionUsuarioOut)
def update_prestacion_usuario(
    prestacion_id: int,
    prestacion: PrestacionUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    updated = PrestacionesUsuarioService.update_prestacion_usuario(db, prestacion_id, prestacion, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="PrestacionUsuario not found")
    return updated


@router.delete("/{prestacion_id}", status_code=204)
def delete_prestacion_usuario(
    prestacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not PrestacionesUsuarioService.delete_prestacion_usuario(db, prestacion_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="PrestacionUsuario not found")
