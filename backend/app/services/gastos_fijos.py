from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_gastos_fijos,
    create_gasto_fijo,
    delete_gasto_fijo,
    get_gasto_fijo,
    list_gastos_fijos,
    update_gasto_fijo,
)
from app.schemas import GastoCreate, GastoOut, GastoUpdate


class GastosFijosService:
    @staticmethod
    def list_gastos_fijos(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[GastoOut], int]:
        gastos = list_gastos_fijos(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_gastos_fijos(db, usuario_id, filtros=filtros)
        return [GastoOut.model_validate(gasto) for gasto in gastos], total

    @staticmethod
    def get_gasto_fijo(db: Session, gasto_id: int, usuario_id: int) -> GastoOut | None:
        gasto = get_gasto_fijo(db, gasto_id, usuario_id)
        if not gasto:
            return None
        return GastoOut.model_validate(gasto)

    @staticmethod
    def create_gasto_fijo(db: Session, dto: GastoCreate, usuario_id: int) -> GastoOut:
        gasto = create_gasto_fijo(db, dto, usuario_id)
        return GastoOut.model_validate(gasto)

    @staticmethod
    def update_gasto_fijo(
        db: Session, gasto_id: int, dto: GastoUpdate, usuario_id: int
    ) -> GastoOut | None:
        gasto = update_gasto_fijo(db, gasto_id, dto, usuario_id)
        if not gasto:
            return None
        return GastoOut.model_validate(gasto)

    @staticmethod
    def delete_gasto_fijo(db: Session, gasto_id: int, usuario_id: int) -> bool:
        return delete_gasto_fijo(db, gasto_id, usuario_id)
