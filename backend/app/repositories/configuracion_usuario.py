from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ConfiguracionUsuario
from app.schemas import ConfigUsuarioCreate, ConfigUsuarioUpdate


def list_configuraciones_usuario(
    db: Session,
    usuario_id: int,
    *,
    limit: int = 50,
    offset: int = 0,
    order_by: Optional[str] = None,
    filtros: Optional[Dict[str, any]] = None,
) -> List[ConfiguracionUsuario]:
    query = select(ConfiguracionUsuario).where(ConfiguracionUsuario.usuario_id == usuario_id)

    # Whitelist order_by
    allowed_orders = {
        "id": ConfiguracionUsuario.id,
        "fecha_creacion": ConfiguracionUsuario.fecha_creacion,
    }
    if order_by and order_by in allowed_orders:
        query = query.order_by(allowed_orders[order_by])
    else:
        query = query.order_by(ConfiguracionUsuario.id.desc())

    query = query.limit(limit).offset(offset)
    return db.execute(query).scalars().all()


def count_configuraciones_usuario(
    db: Session, usuario_id: int, filtros: Optional[Dict[str, any]] = None
) -> int:
    query = select(ConfiguracionUsuario).where(ConfiguracionUsuario.usuario_id == usuario_id)

    result = db.execute(query)
    return len(result.scalars().all())


def get_configuracion_usuario(db: Session, config_id: int, usuario_id: int) -> Optional[ConfiguracionUsuario]:
    query = select(ConfiguracionUsuario).where(
        ConfiguracionUsuario.id == config_id, ConfiguracionUsuario.usuario_id == usuario_id
    )
    return db.execute(query).scalar_one_or_none()


def get_config_by_usuario(db: Session, usuario_id: int) -> Optional[ConfiguracionUsuario]:
    query = select(ConfiguracionUsuario).where(ConfiguracionUsuario.usuario_id == usuario_id)
    return db.execute(query).scalar_one_or_none()


def create_configuracion_usuario(db: Session, dto: ConfigUsuarioCreate, usuario_id: int) -> ConfiguracionUsuario:
    config = ConfiguracionUsuario(**dto.model_dump(), usuario_id=usuario_id)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_configuracion_usuario(
    db: Session, config_id: int, dto: ConfigUsuarioUpdate, usuario_id: int
) -> Optional[ConfiguracionUsuario]:
    config = get_configuracion_usuario(db, config_id, usuario_id)
    if not config:
        return None

    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


def delete_configuracion_usuario(db: Session, config_id: int, usuario_id: int) -> bool:
    config = get_configuracion_usuario(db, config_id, usuario_id)
    if not config:
        return False

    db.delete(config)
    db.commit()
    return True
