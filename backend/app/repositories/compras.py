from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Compra
from app.schemas import CompraCreate, CompraUpdate


def list_compras(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[Compra]:
    query = select(Compra).where(Compra.usuario_id == usuario_id)

    if filtros:
        if "from" in filtros and filtros["from"]:
            query = query.where(Compra.fecha_compra >= filtros["from"])
        if "to" in filtros and filtros["to"]:
            query = query.where(Compra.fecha_compra <= filtros["to"])
        if "insumo_q" in filtros and filtros["insumo_q"]:
            q = filtros["insumo_q"]
            query = query.where(
                or_(
                    Compra.insumo_basico.codigo.ilike(f"%{q}%"),
                    Compra.insumo_basico.nombre.ilike(f"%{q}%"),
                )
            )

    # Whitelist order_by
    allowed_orders = {
        "id": Compra.id,
        "fecha_compra": Compra.fecha_compra,
        "precio_total_ars": Compra.precio_total_ars,
        "fecha_creacion": Compra.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(Compra.fecha_compra.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_compras(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(Compra).where(Compra.usuario_id == usuario_id)

    if filtros:
        if "from" in filtros and filtros["from"]:
            query = query.where(Compra.fecha_compra >= filtros["from"])
        if "to" in filtros and filtros["to"]:
            query = query.where(Compra.fecha_compra <= filtros["to"])
        if "insumo_q" in filtros and filtros["insumo_q"]:
            q = filtros["insumo_q"]
            query = query.where(
                or_(
                    Compra.insumo_basico.codigo.ilike(f"%{q}%"),
                    Compra.insumo_basico.nombre.ilike(f"%{q}%"),
                )
            )

    result = db.execute(query)
    return len(result.scalars().all())


def get_compra(db: Session, compra_id: int, usuario_id: int) -> Optional[Compra]:
    query = select(Compra).where(
        Compra.id == compra_id, Compra.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_compra(db: Session, dto: CompraCreate, usuario_id: int) -> Compra:
    compra = Compra(**dto.model_dump(), usuario_id=usuario_id)
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra


def update_compra(
    db: Session, compra_id: int, dto: CompraUpdate, usuario_id: int
) -> Optional[Compra]:
    compra = get_compra(db, compra_id, usuario_id)
    if not compra:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(compra, field, value)

    db.commit()
    db.refresh(compra)
    return compra


def delete_compra(db: Session, compra_id: int, usuario_id: int) -> bool:
    compra = get_compra(db, compra_id, usuario_id)
    if not compra:
        return False

    db.delete(compra)
    db.commit()
    return True
