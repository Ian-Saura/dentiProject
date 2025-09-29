from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_consultas,
    create_consulta,
    delete_consulta,
    get_consulta,
    list_consultas,
    update_consulta,
)
from app.schemas import ConsultaCreate, ConsultaOut, ConsultaUpdate


class ConsultasService:
    @staticmethod
    def list_consultas(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[ConsultaOut], int]:
        consultas = list_consultas(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_consultas(db, usuario_id, filtros=filtros)
        return [ConsultaOut.model_validate(consulta) for consulta in consultas], total

    @staticmethod
    def get_consulta(db: Session, consulta_id: int, usuario_id: int) -> ConsultaOut | None:
        consulta = get_consulta(db, consulta_id, usuario_id)
        if not consulta:
            return None
        return ConsultaOut.model_validate(consulta)

    @staticmethod
    def create_consulta(db: Session, dto: ConsultaCreate, usuario_id: int) -> ConsultaOut:
        try:
            consulta = create_consulta(db, dto, usuario_id)
            return ConsultaOut.model_validate(consulta)
        except ValueError as e:
            raise ValueError(str(e))  # Re-raise validation errors

    @staticmethod
    def update_consulta(
        db: Session, consulta_id: int, dto: ConsultaUpdate, usuario_id: int
    ) -> ConsultaOut | None:
        try:
            consulta = update_consulta(db, consulta_id, dto, usuario_id)
            if not consulta:
                return None
            return ConsultaOut.model_validate(consulta)
        except ValueError as e:
            raise ValueError(str(e))  # Re-raise validation errors

    @staticmethod
    def delete_consulta(db: Session, consulta_id: int, usuario_id: int) -> bool:
        return delete_consulta(db, consulta_id, usuario_id)
