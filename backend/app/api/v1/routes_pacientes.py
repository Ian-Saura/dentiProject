from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import PacienteCreate, PacienteOut, PacienteUpdate
from app.services import PacientesService
from app.utils import validate_pagination_params

router = APIRouter(prefix="/pacientes", tags=["pacientes"])


@router.get("/", response_model=List[PacienteOut])
def list_pacientes(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    q: str = Query(None),
    activo: bool = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if q:
        filtros["q"] = q
    if activo is not None:
        filtros["activo"] = activo

    pacientes, total = PacientesService.list_pacientes(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response.headers["X-Total-Count"] = str(total)
    return pacientes


@router.post("/", response_model=PacienteOut)
def create_paciente(
    paciente: PacienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return PacientesService.create_paciente(db, paciente, tenant.user_id)


@router.get("/{paciente_id}", response_model=PacienteOut)
def get_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    paciente = PacientesService.get_paciente(db, paciente_id, tenant.user_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente not found")
    return paciente


@router.patch("/{paciente_id}", response_model=PacienteOut)
def update_paciente(
    paciente_id: int,
    paciente: PacienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    updated = PacientesService.update_paciente(db, paciente_id, paciente, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Paciente not found")
    return updated


@router.delete("/{paciente_id}", status_code=204)
def delete_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not PacientesService.delete_paciente(db, paciente_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Paciente not found")
