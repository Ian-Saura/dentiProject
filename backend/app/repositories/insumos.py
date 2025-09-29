from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import InsumoBasico


def list_insumos_basicos(
    db: Session,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[InsumoBasico]:
    query = select(InsumoBasico).where(InsumoBasico.activo == True)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    InsumoBasico.nombre.ilike(f"%{q}%"),
                    InsumoBasico.codigo.ilike(f"%{q}%"),
                )
            )

    # Whitelist order_by
    allowed_orders = {
        "id": InsumoBasico.id,
        "codigo": InsumoBasico.codigo,
        "nombre": InsumoBasico.nombre,
        "categoria": InsumoBasico.categoria,
        "fecha_creacion": InsumoBasico.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(InsumoBasico.id)

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_insumos_basicos(db: Session, filtros: Optional[Dict[str, any]] = None) -> int:
    query = select(InsumoBasico).where(InsumoBasico.activo == True)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    InsumoBasico.nombre.ilike(f"%{q}%"),
                    InsumoBasico.codigo.ilike(f"%{q}%"),
                )
            )

    result = db.execute(query)
    return len(result.scalars().all())


def get_insumo_basico(db: Session, insumo_id: int) -> Optional[InsumoBasico]:
    query = select(InsumoBasico).where(InsumoBasico.id == insumo_id, InsumoBasico.activo == True)
    return db.execute(query).scalar_one_or_none()
