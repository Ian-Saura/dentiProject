from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_prestaciones_usuario,
    create_prestacion_usuario,
    delete_prestacion_usuario,
    get_prestacion_usuario,
    list_prestaciones_usuario,
    update_prestacion_usuario,
)
from app.schemas import PrestacionUsuarioCreate, PrestacionUsuarioOut, PrestacionUsuarioUpdate


class PrestacionesUsuarioService:
    @staticmethod
    def list_prestaciones_usuario(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[PrestacionUsuarioOut], int]:
        prestaciones = list_prestaciones_usuario(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_prestaciones_usuario(db, usuario_id, filtros=filtros)
        return [PrestacionUsuarioOut.model_validate(prestacion) for prestacion in prestaciones], total

    @staticmethod
    def get_prestacion_usuario(db: Session, prestacion_id: int, usuario_id: int) -> PrestacionUsuarioOut | None:
        prestacion = get_prestacion_usuario(db, prestacion_id, usuario_id)
        if not prestacion:
            return None
        return PrestacionUsuarioOut.model_validate(prestacion)

    @staticmethod
    def create_prestacion_usuario(db: Session, dto: PrestacionUsuarioCreate, usuario_id: int) -> PrestacionUsuarioOut:
        prestacion = create_prestacion_usuario(db, dto, usuario_id)
        return PrestacionUsuarioOut.model_validate(prestacion)

    @staticmethod
    def update_prestacion_usuario(
        db: Session, prestacion_id: int, dto: PrestacionUsuarioUpdate, usuario_id: int
    ) -> PrestacionUsuarioOut | None:
        prestacion = update_prestacion_usuario(db, prestacion_id, dto, usuario_id)
        if not prestacion:
            return None
        return PrestacionUsuarioOut.model_validate(prestacion)

    @staticmethod
    def delete_prestacion_usuario(db: Session, prestacion_id: int, usuario_id: int) -> bool:
        return delete_prestacion_usuario(db, prestacion_id, usuario_id)
