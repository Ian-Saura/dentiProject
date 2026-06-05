from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Consulta, PrestacionUsuario
from app.schemas import ConsultaCreate, ConsultaUpdate


def list_consultas(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[Consulta]:
    from app.models import Paciente
    
    query = (
        select(Consulta)
        .where(Consulta.usuario_id == usuario_id)
        .options(
            joinedload(Consulta.paciente),
            joinedload(Consulta.prestacion_usuario).joinedload(PrestacionUsuario.prestacion)
        )
    )

    if filtros:
        if "from" in filtros and filtros["from"]:
            query = query.where(Consulta.fecha_consulta >= filtros["from"])
        if "to" in filtros and filtros["to"]:
            query = query.where(Consulta.fecha_consulta <= filtros["to"])
        if "medio_pago" in filtros and filtros["medio_pago"]:
            query = query.where(Consulta.medio_pago == filtros["medio_pago"])
        if "paciente_id" in filtros and filtros["paciente_id"]:
            query = query.where(Consulta.paciente_id == filtros["paciente_id"])
        if "paciente_q" in filtros and filtros["paciente_q"]:
            q = filtros["paciente_q"]
            query = query.join(Paciente, Consulta.paciente_id == Paciente.id).where(
                or_(
                    Paciente.nombre.ilike(f"%{q}%"),
                    Paciente.apellido.ilike(f"%{q}%"),
                )
            )

    # Whitelist order_by
    allowed_orders = {
        "id": Consulta.id,
        "fecha_consulta": Consulta.fecha_consulta,
        "monto_ars": Consulta.monto_ars,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(Consulta.fecha_consulta.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_consultas(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    from app.models import Paciente
    
    query = select(Consulta).where(Consulta.usuario_id == usuario_id)

    if filtros:
        if "from" in filtros and filtros["from"]:
            query = query.where(Consulta.fecha_consulta >= filtros["from"])
        if "to" in filtros and filtros["to"]:
            query = query.where(Consulta.fecha_consulta <= filtros["to"])
        if "medio_pago" in filtros and filtros["medio_pago"]:
            query = query.where(Consulta.medio_pago == filtros["medio_pago"])
        if "paciente_id" in filtros and filtros["paciente_id"]:
            query = query.where(Consulta.paciente_id == filtros["paciente_id"])
        if "paciente_q" in filtros and filtros["paciente_q"]:
            q = filtros["paciente_q"]
            query = query.join(Paciente, Consulta.paciente_id == Paciente.id).where(
                or_(
                    Paciente.nombre.ilike(f"%{q}%"),
                    Paciente.apellido.ilike(f"%{q}%"),
                )
            )

    result = db.execute(query)
    return len(result.scalars().all())


def get_consulta(db: Session, consulta_id: int, usuario_id: int) -> Optional[Consulta]:
    query = (
        select(Consulta)
        .where(Consulta.id == consulta_id, Consulta.usuario_id == usuario_id)
        .options(
            joinedload(Consulta.paciente),
            joinedload(Consulta.prestacion_usuario).joinedload(PrestacionUsuario.prestacion)
        )
    )
    return db.execute(query).scalar_one_or_none()


def create_consulta(db: Session, dto: ConsultaCreate, usuario_id: int) -> Consulta:
    # Validate that paciente_id and prestacion_usuario_id belong to same usuario_id
    from app.models import Paciente
    
    paciente_query = select(Paciente).where(
        Paciente.id == dto.paciente_id, Paciente.usuario_id == usuario_id
    )
    if not db.execute(paciente_query).scalar_one_or_none():
        raise ValueError("Paciente no pertenece al usuario")

    prestacion_query = select(PrestacionUsuario).where(
        PrestacionUsuario.id == dto.prestacion_usuario_id,
        PrestacionUsuario.usuario_id == usuario_id
    )
    if not db.execute(prestacion_query).scalar_one_or_none():
        raise ValueError("PrestacionUsuario no pertenece al usuario")

    consulta = Consulta(**dto.model_dump(), usuario_id=usuario_id)
    db.add(consulta)
    db.commit()
    db.refresh(consulta)
    # Reload with relationships
    return get_consulta(db, consulta.id, usuario_id)


def update_consulta(
    db: Session, consulta_id: int, dto: ConsultaUpdate, usuario_id: int
) -> Optional[Consulta]:
    consulta = get_consulta(db, consulta_id, usuario_id)
    if not consulta:
        return None

    update_data = dto.model_dump(exclude_unset=True)

    # Validate if paciente_id or prestacion_usuario_id changed
    if "paciente_id" in update_data:
        from app.models import Paciente
        paciente_query = select(Paciente).where(
            Paciente.id == update_data["paciente_id"], Paciente.usuario_id == usuario_id
        )
        if not db.execute(paciente_query).scalar_one_or_none():
            raise ValueError("Paciente no pertenece al usuario")

    if "prestacion_usuario_id" in update_data:
        prestacion_query = select(PrestacionUsuario).where(
            PrestacionUsuario.id == update_data["prestacion_usuario_id"],
            PrestacionUsuario.usuario_id == usuario_id
        )
        if not db.execute(prestacion_query).scalar_one_or_none():
            raise ValueError("PrestacionUsuario no pertenece al usuario")

    for field, value in update_data.items():
        setattr(consulta, field, value)

    db.commit()
    db.refresh(consulta)
    # Reload with relationships
    return get_consulta(db, consulta.id, usuario_id)


def delete_consulta(db: Session, consulta_id: int, usuario_id: int) -> bool:
    consulta = get_consulta(db, consulta_id, usuario_id)
    if not consulta:
        return False

    db.delete(consulta)
    db.commit()
    return True
