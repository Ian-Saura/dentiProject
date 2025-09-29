from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_compras,
    create_compra,
    delete_compra,
    get_compra,
    list_compras,
    update_compra,
)
from app.schemas import CompraCreate, CompraOut, CompraUpdate


class ComprasService:
    @staticmethod
    def list_compras(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[CompraOut], int]:
        compras = list_compras(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_compras(db, usuario_id, filtros=filtros)
        return [CompraOut.model_validate(compra) for compra in compras], total

    @staticmethod
    def get_compra(db: Session, compra_id: int, usuario_id: int) -> CompraOut | None:
        compra = get_compra(db, compra_id, usuario_id)
        if not compra:
            return None
        return CompraOut.model_validate(compra)

    @staticmethod
    def create_compra(db: Session, dto: CompraCreate, usuario_id: int) -> CompraOut:
        compra = create_compra(db, dto, usuario_id)
        return CompraOut.model_validate(compra)

    @staticmethod
    def update_compra(
        db: Session, compra_id: int, dto: CompraUpdate, usuario_id: int
    ) -> CompraOut | None:
        compra = update_compra(db, compra_id, dto, usuario_id)
        if not compra:
            return None
        return CompraOut.model_validate(compra)

    @staticmethod
    def delete_compra(db: Session, compra_id: int, usuario_id: int) -> bool:
        return delete_compra(db, compra_id, usuario_id)
