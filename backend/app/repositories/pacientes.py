from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Paciente
from app.schemas import PacienteCreate, PacienteUpdate


def list_pacientes(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[Paciente]:
    query = select(Paciente).where(Paciente.usuario_id == usuario_id)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    Paciente.nombre.ilike(f"%{q}%"),
                    Paciente.apellido.ilike(f"%{q}%"),
                    Paciente.dni.ilike(f"%{q}%"),
                )
            )
        if "activo" in filtros:
            query = query.where(Paciente.activo == filtros["activo"])

    # Whitelist order_by
    allowed_orders = {
        "id": Paciente.id,
        "nombre": Paciente.nombre,
        "apellido": Paciente.apellido,
        "fecha_registro": Paciente.fecha_registro,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(Paciente.id.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_pacientes(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(Paciente).where(Paciente.usuario_id == usuario_id)

    if filtros:
        if "q" in filtros and filtros["q"]:
            q = filtros["q"]
            query = query.where(
                or_(
                    Paciente.nombre.ilike(f"%{q}%"),
                    Paciente.apellido.ilike(f"%{q}%"),
                    Paciente.dni.ilike(f"%{q}%"),
                )
            )
        if "activo" in filtros:
            query = query.where(Paciente.activo == filtros["activo"])

    result = db.execute(query)
    return len(result.scalars().all())


def get_paciente(db: Session, paciente_id: int, usuario_id: int) -> Optional[Paciente]:
    query = select(Paciente).where(
        Paciente.id == paciente_id, Paciente.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def create_paciente(db: Session, dto: PacienteCreate, usuario_id: int) -> Paciente:
    paciente = Paciente(**dto.model_dump(), usuario_id=usuario_id)
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


def update_paciente(
    db: Session, paciente_id: int, dto: PacienteUpdate, usuario_id: int
) -> Optional[Paciente]:
    paciente = get_paciente(db, paciente_id, usuario_id)
    if not paciente:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paciente, field, value)

    db.commit()
    db.refresh(paciente)
    return paciente


def delete_paciente(db: Session, paciente_id: int, usuario_id: int) -> bool:
    paciente = get_paciente(db, paciente_id, usuario_id)
    if not paciente:
        return False

    db.delete(paciente)
    db.commit()
    return True
