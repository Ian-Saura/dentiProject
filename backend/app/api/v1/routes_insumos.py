from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import list_insumos_basicos, count_insumos_basicos, get_insumo_basico
from app.schemas import InsumoOut
from app.utils import validate_pagination_params

router = APIRouter(prefix="/insumos-basicos", tags=["insumos-basicos"])


@router.get("/", response_model=List[InsumoOut])
def list_insumos(
    response: Response,
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

    insumos = list_insumos_basicos(db, **pagination, order_by=order_by, filtros=filtros)
    total = count_insumos_basicos(db, filtros)

    response.headers["X-Total-Count"] = str(total)
    return insumos


@router.get("/{insumo_id}", response_model=InsumoOut)
def get_insumo(
    insumo_id: int,
    db: Session = Depends(get_db),
):
    insumo = get_insumo_basico(db, insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo not found")
    return InsumoOut.model_validate(insumo)
