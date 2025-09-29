from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Prestacion


def list_prestaciones(
    db: Session,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[Prestacion]:
    query = select(Prestacion).where(Prestacion.activo == True)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    Prestacion.nombre.ilike(f"%{q}%"),
                    Prestacion.codigo.ilike(f"%{q}%"),
                )
            )

    # Whitelist order_by
    allowed_orders = {
        "id": Prestacion.id,
        "codigo": Prestacion.codigo,
        "nombre": Prestacion.nombre,
        "categoria": Prestacion.categoria,
        "fecha_creacion": Prestacion.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(Prestacion.id)

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_prestaciones(db: Session, filtros: Optional[Dict[str, any]] = None) -> int:
    query = select(Prestacion).where(Prestacion.activo == True)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    Prestacion.nombre.ilike(f"%{q}%"),
                    Prestacion.codigo.ilike(f"%{q}%"),
                )
            )

    result = db.execute(query)
    return len(result.scalars().all())


def get_prestacion(db: Session, prestacion_id: int) -> Optional[Prestacion]:
    query = select(Prestacion).where(Prestacion.id == prestacion_id, Prestacion.activo == True)
    return db.execute(query).scalar_one_or_none()
