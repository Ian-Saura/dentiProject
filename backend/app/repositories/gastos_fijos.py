from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import GastoFijo
from app.schemas import GastoCreate, GastoUpdate


def list_gastos_fijos(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[GastoFijo]:
    query = select(GastoFijo).where(GastoFijo.usuario_id == usuario_id)

    if filtros:
        if "activo" in filtros:
            query = query.where(GastoFijo.activo == filtros["activo"])

    # Whitelist order_by
    allowed_orders = {
        "id": GastoFijo.id,
        "concepto": GastoFijo.concepto,
        "monto_mensual_ars": GastoFijo.monto_mensual_ars,
        "fecha_creacion": GastoFijo.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(GastoFijo.id.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_gastos_fijos(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(GastoFijo).where(GastoFijo.usuario_id == usuario_id)

    if filtros:
        if "activo" in filtros:
            query = query.where(GastoFijo.activo == filtros["activo"])

    result = db.execute(query)
    return len(result.scalars().all())


def get_gasto_fijo(db: Session, gasto_id: int, usuario_id: int) -> Optional[GastoFijo]:
    query = select(GastoFijo).where(
        GastoFijo.id == gasto_id, GastoFijo.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_gasto_fijo(db: Session, dto: GastoCreate, usuario_id: int) -> GastoFijo:
    gasto = GastoFijo(**dto.model_dump(), usuario_id=usuario_id)
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    return gasto


def update_gasto_fijo(
    db: Session, gasto_id: int, dto: GastoUpdate, usuario_id: int
) -> Optional[GastoFijo]:
    gasto = get_gasto_fijo(db, gasto_id, usuario_id)
    if not gasto:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gasto, field, value)

    db.commit()
    db.refresh(gasto)
    return gasto


def delete_gasto_fijo(db: Session, gasto_id: int, usuario_id: int) -> bool:
    gasto = get_gasto_fijo(db, gasto_id, usuario_id)
    if not gasto:
        return False

    db.delete(gasto)
    db.commit()
    return True
