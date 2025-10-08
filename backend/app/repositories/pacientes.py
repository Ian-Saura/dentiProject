from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, and_, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

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
            q = filtros["q"].strip()
            # Búsqueda mejorada: nombre, apellido, DNI, o iniciales
            search_conditions = [
                Paciente.nombre.ilike(f"%{q}%"),
                Paciente.apellido.ilike(f"%{q}%"),
                Paciente.dni.ilike(f"%{q}%"),
            ]
            
            # Si son 2-3 caracteres, buscar por iniciales (ej: "JP" = Juan Pérez)
            if len(q) >= 2 and len(q) <= 3 and q.isalpha():
                # Buscar donde nombre empiece con primera letra Y apellido con segunda
                if len(q) == 2:
                    search_conditions.append(
                        and_(
                            Paciente.nombre.ilike(f"{q[0]}%"),
                            Paciente.apellido.ilike(f"{q[1]}%")
                        )
                    )
            
            query = query.where(or_(*search_conditions))
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
            q = filtros["q"].strip()
            # Búsqueda mejorada: nombre, apellido, DNI, o iniciales
            search_conditions = [
                Paciente.nombre.ilike(f"%{q}%"),
                Paciente.apellido.ilike(f"%{q}%"),
                Paciente.dni.ilike(f"%{q}%"),
            ]
            
            # Si son 2-3 caracteres, buscar por iniciales (ej: "JP" = Juan Pérez)
            if len(q) >= 2 and len(q) <= 3 and q.isalpha():
                # Buscar donde nombre empiece con primera letra Y apellido con segunda
                if len(q) == 2:
                    search_conditions.append(
                        and_(
                            Paciente.nombre.ilike(f"{q[0]}%"),
                            Paciente.apellido.ilike(f"{q[1]}%")
                        )
                    )
            
            query = query.where(or_(*search_conditions))
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
    try:
        paciente = Paciente(**dto.model_dump(), usuario_id=usuario_id)
        db.add(paciente)
        db.commit()
        db.refresh(paciente)
        return paciente
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if 'dni' in error_msg.lower() and 'unique' in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un paciente con DNI {dto.dni}. Los DNI deben ser únicos."
            )
        raise HTTPException(status_code=400, detail="Error al crear paciente. Verifica los datos ingresados.")


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
