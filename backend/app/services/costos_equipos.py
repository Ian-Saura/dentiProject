from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_costos_equipos,
    create_costo_equipo,
    delete_costo_equipo,
    get_costo_equipo,
    list_costos_equipos,
    update_costo_equipo,
)
from app.schemas import EquipoCreate, EquipoOut, EquipoUpdate


class CostosEquiposService:
    @staticmethod
    def list_costos_equipos(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[EquipoOut], int]:
        equipos = list_costos_equipos(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_costos_equipos(db, usuario_id, filtros=filtros)
        return [EquipoOut.model_validate(equipo) for equipo in equipos], total

    @staticmethod
    def get_costo_equipo(db: Session, equipo_id: int, usuario_id: int) -> EquipoOut | None:
        equipo = get_costo_equipo(db, equipo_id, usuario_id)
        if not equipo:
            return None
        return EquipoOut.model_validate(equipo)

    @staticmethod
    def create_costo_equipo(db: Session, dto: EquipoCreate, usuario_id: int) -> EquipoOut:
        equipo = create_costo_equipo(db, dto, usuario_id)
        return EquipoOut.model_validate(equipo)

    @staticmethod
    def update_costo_equipo(
        db: Session, equipo_id: int, dto: EquipoUpdate, usuario_id: int
    ) -> EquipoOut | None:
        equipo = update_costo_equipo(db, equipo_id, dto, usuario_id)
        if not equipo:
            return None
        return EquipoOut.model_validate(equipo)

    @staticmethod
    def delete_costo_equipo(db: Session, equipo_id: int, usuario_id: int) -> bool:
        return delete_costo_equipo(db, equipo_id, usuario_id)
