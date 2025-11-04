from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from loguru import logger

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
    # ALWAYS create a new prestacion_usuario
    # Each consulta is unique and needs its own prestacion_usuario
    # Even if the name is the same, they represent different services at different times
    logger.info(f"🔧 create_prestacion_usuario called with: usuario_id={usuario_id}, dto={dto.model_dump()}")
    prestacion = PrestacionUsuario(**dto.model_dump(), usuario_id=usuario_id)
    logger.info(f"🔧 About to insert prestacion_usuario into DB...")
    db.add(prestacion)
    db.commit()
    db.refresh(prestacion)
    logger.info(f"🔧 prestacion_usuario created with ID: {prestacion.id}, nombre: {prestacion.nombre_personalizado}")
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
