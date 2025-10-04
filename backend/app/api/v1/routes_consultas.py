from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import ConsultaCreate, ConsultaOut, ConsultaUpdate
from app.services import ConsultasService
from app.utils import validate_pagination_params

router = APIRouter(prefix="/consultas", tags=["consultas"])


@router.get("/", response_model=List[ConsultaOut])
def list_consultas(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(50, ge=1, le=10000),  # Increased limit for reports
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    from_: str = Query(None, alias="from"),
    to: str = Query(None),
    medio_pago: str = Query(None),
    paciente_q: str = Query(None),
):
    tenant = TenantContext(current_user)
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if from_:
        filtros["from"] = from_
    if to:
        filtros["to"] = to
    if medio_pago:
        filtros["medio_pago"] = medio_pago
    if paciente_q:
        filtros["paciente_q"] = paciente_q

    consultas, total = ConsultasService.list_consultas(
        db, tenant.user_id, **pagination, order_by=order_by, filtros=filtros
    )

    response.headers["X-Total-Count"] = str(total)
    return consultas


@router.post("/", response_model=ConsultaOut)
def create_consulta(
    consulta: ConsultaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    try:
        return ConsultasService.create_consulta(db, consulta, tenant.user_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/{consulta_id}", response_model=ConsultaOut)
def get_consulta(
    consulta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    consulta = ConsultasService.get_consulta(db, consulta_id, tenant.user_id)
    if not consulta:
        raise HTTPException(status_code=404, detail="Consulta not found")
    return consulta


@router.patch("/{consulta_id}", response_model=ConsultaOut)
def update_consulta(
    consulta_id: int,
    consulta: ConsultaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    try:
        updated = ConsultasService.update_consulta(db, consulta_id, consulta, tenant.user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Consulta not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.delete("/{consulta_id}", status_code=204)
def delete_consulta(
    consulta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    if not ConsultasService.delete_consulta(db, consulta_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Consulta not found")
