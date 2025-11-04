from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import PrestacionUsuario
from app.schemas import PrestacionUsuarioCreate, PrestacionUsuarioUpdate


def list_prestaciones_usuario(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[PrestacionUsuario]:
    query = select(PrestacionUsuario).where(PrestacionUsuario.usuario_id == usuario_id)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    PrestacionUsuario.nombre_personalizado.ilike(f"%{q}%"),
                    PrestacionUsuario.prestacion.nombre.ilike(f"%{q}%"),
                    PrestacionUsuario.prestacion.codigo.ilike(f"%{q}%"),
                )
            )

    # Whitelist order_by
    allowed_orders = {
        "id": PrestacionUsuario.id,
        "nombre_personalizado": PrestacionUsuario.nombre_personalizado,
        "margen_ganancia_porcentaje": PrestacionUsuario.margen_ganancia_porcentaje,
        "fecha_creacion": PrestacionUsuario.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(PrestacionUsuario.id.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_prestaciones_usuario(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(PrestacionUsuario).where(PrestacionUsuario.usuario_id == usuario_id)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    PrestacionUsuario.nombre_personalizado.ilike(f"%{q}%"),
                    PrestacionUsuario.prestacion.nombre.ilike(f"%{q}%"),
                    PrestacionUsuario.prestacion.codigo.ilike(f"%{q}%"),
                )
            )

    result = db.execute(query)
    return len(result.scalars().all())


def get_prestacion_usuario(db: Session, prestacion_id: int, usuario_id: int) -> Optional[PrestacionUsuario]:
    query = select(PrestacionUsuario).where(
        PrestacionUsuario.id == prestacion_id, PrestacionUsuario.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_prestacion_usuario(db: Session, dto: PrestacionUsuarioCreate, usuario_id: int) -> PrestacionUsuario:
    # Check if prestacion_usuario already exists for this usuario_id and nombre_personalizado
    # This allows multiple custom treatments using the same base prestacion
    if dto.nombre_personalizado:
        existing_query = select(PrestacionUsuario).where(
            PrestacionUsuario.usuario_id == usuario_id,
            PrestacionUsuario.nombre_personalizado == dto.nombre_personalizado
        )
        existing = db.execute(existing_query).scalar_one_or_none()
        
        if existing:
            # If already exists with same custom name, just return it
            # DO NOT update to avoid affecting other consultas that use this prestacion
            return existing
    
    # If doesn't exist, create new one
    prestacion = PrestacionUsuario(**dto.model_dump(), usuario_id=usuario_id)
    db.add(prestacion)
    db.commit()
    db.refresh(prestacion)
    return prestacion


def update_prestacion_usuario(
    db: Session, prestacion_id: int, dto: PrestacionUsuarioUpdate, usuario_id: int
) -> Optional[PrestacionUsuario]:
    prestacion = get_prestacion_usuario(db, prestacion_id, usuario_id)
    if not prestacion:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prestacion, field, value)

    db.commit()
    db.refresh(prestacion)
    return prestacion


def delete_prestacion_usuario(db: Session, prestacion_id: int, usuario_id: int) -> bool:
    prestacion = get_prestacion_usuario(db, prestacion_id, usuario_id)
    if not prestacion:
        return False

    db.delete(prestacion)
    db.commit()
    return True
