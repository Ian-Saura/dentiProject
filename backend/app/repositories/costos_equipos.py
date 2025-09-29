from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CostoEquipo
from app.schemas import EquipoCreate, EquipoUpdate


def list_costos_equipos(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[CostoEquipo]:
    query = select(CostoEquipo).where(CostoEquipo.usuario_id == usuario_id)

    if filtros:
        if "activo" in filtros:
            query = query.where(CostoEquipo.activo == filtros["activo"])

    # Whitelist order_by
    allowed_orders = {
        "id": CostoEquipo.id,
        "nombre_equipo": CostoEquipo.nombre_equipo,
        "fecha_compra": CostoEquipo.fecha_compra,
        "fecha_creacion": CostoEquipo.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(CostoEquipo.id.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_costos_equipos(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(CostoEquipo).where(CostoEquipo.usuario_id == usuario_id)

    if filtros:
        if "activo" in filtros:
            query = query.where(CostoEquipo.activo == filtros["activo"])

    result = db.execute(query)
    return len(result.scalars().all())


def get_costo_equipo(db: Session, equipo_id: int, usuario_id: int) -> Optional[CostoEquipo]:
    query = select(CostoEquipo).where(
        CostoEquipo.id == equipo_id, CostoEquipo.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_costo_equipo(db: Session, dto: EquipoCreate, usuario_id: int) -> CostoEquipo:
    equipo = CostoEquipo(**dto.model_dump(), usuario_id=usuario_id)
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


def update_costo_equipo(
    db: Session, equipo_id: int, dto: EquipoUpdate, usuario_id: int
) -> Optional[CostoEquipo]:
    equipo = get_costo_equipo(db, equipo_id, usuario_id)
    if not equipo:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipo, field, value)

    db.commit()
    db.refresh(equipo)
    return equipo


def delete_costo_equipo(db: Session, equipo_id: int, usuario_id: int) -> bool:
    equipo = get_costo_equipo(db, equipo_id, usuario_id)
    if not equipo:
        return False

    db.delete(equipo)
    db.commit()
    return True
