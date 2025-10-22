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
    data = dto.model_dump()
    
    # Calculate monto_mensual_ars based on moneda
    if data.get('moneda') == 'USD':
        # Get tipo_cambio from config
        from app.models import ConfiguracionUsuario
        config = db.query(ConfiguracionUsuario).filter(
            ConfiguracionUsuario.usuario_id == usuario_id
        ).first()
        tipo_cambio = float(config.tipo_cambio_usd_ars) if config and config.tipo_cambio_usd_ars else 1335.0
        data['monto_mensual_ars'] = data['monto_mensual'] * tipo_cambio
    else:
        data['monto_mensual_ars'] = data['monto_mensual']
    
    gasto = GastoFijo(**data, usuario_id=usuario_id)
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
    
    # Recalculate monto_mensual_ars if monto_mensual or moneda changed
    if 'monto_mensual' in update_data or 'moneda' in update_data:
        # Get tipo_cambio from config
        from app.models import ConfiguracionUsuario
        config = db.query(ConfiguracionUsuario).filter(
            ConfiguracionUsuario.usuario_id == usuario_id
        ).first()
        tipo_cambio = float(config.tipo_cambio_usd_ars) if config and config.tipo_cambio_usd_ars else 1335.0
        
        # Use updated or existing values
        monto = update_data.get('monto_mensual', gasto.monto_mensual)
        moneda = update_data.get('moneda', gasto.moneda)
        
        if moneda == 'USD':
            update_data['monto_mensual_ars'] = monto * tipo_cambio
        else:
            update_data['monto_mensual_ars'] = monto
    
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
