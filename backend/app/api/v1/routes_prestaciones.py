from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import list_prestaciones, count_prestaciones, get_prestacion
from app.schemas import PrestacionOut
from app.utils import validate_pagination_params, add_total_count_header

router = APIRouter(prefix="/prestaciones", tags=["prestaciones"])


@router.get("/", response_model=List[PrestacionOut])
def list_prestaciones_endpoint(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query(None),
    q: str = Query(None),
):
    pagination = validate_pagination_params(limit, offset)
    filtros = {}
    if q:
        filtros["q"] = q

    prestaciones, total = list_prestaciones(db, **pagination, order_by=order_by, filtros=filtros), count_prestaciones(db, filtros)

    response = prestaciones
    return add_total_count_header(response, total)


@router.get("/{prestacion_id}", response_model=PrestacionOut)
def get_prestacion_endpoint(
    prestacion_id: int,
    db: Session = Depends(get_db),
):
    prestacion = get_prestacion(db, prestacion_id)
    if not prestacion:
        raise HTTPException(status_code=404, detail="Prestacion not found")
    return PrestacionOut.model_validate(prestacion)
