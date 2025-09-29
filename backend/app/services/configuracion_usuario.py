from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_configuraciones_usuario,
    create_configuracion_usuario,
    delete_configuracion_usuario,
    get_config_by_usuario,
    get_configuracion_usuario,
    list_configuraciones_usuario,
    update_configuracion_usuario,
)
from app.schemas import ConfigUsuarioCreate, ConfigUsuarioOut, ConfigUsuarioUpdate


class ConfiguracionUsuarioService:
    @staticmethod
    def list_configuraciones_usuario(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[ConfigUsuarioOut], int]:
        configs = list_configuraciones_usuario(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_configuraciones_usuario(db, usuario_id, filtros=filtros)
        return [ConfigUsuarioOut.model_validate(config) for config in configs], total

    @staticmethod
    def get_configuracion_usuario(db: Session, config_id: int, usuario_id: int) -> ConfigUsuarioOut | None:
        config = get_configuracion_usuario(db, config_id, usuario_id)
        if not config:
            return None
        return ConfigUsuarioOut.model_validate(config)

    @staticmethod
    def get_config_by_usuario(db: Session, usuario_id: int) -> ConfigUsuarioOut | None:
        config = get_config_by_usuario(db, usuario_id)
        if not config:
            return None
        return ConfigUsuarioOut.model_validate(config)

    @staticmethod
    def create_configuracion_usuario(db: Session, dto: ConfigUsuarioCreate, usuario_id: int) -> ConfigUsuarioOut:
        config = create_configuracion_usuario(db, dto, usuario_id)
        return ConfigUsuarioOut.model_validate(config)

    @staticmethod
    def update_configuracion_usuario(
        db: Session, config_id: int, dto: ConfigUsuarioUpdate, usuario_id: int
    ) -> ConfigUsuarioOut | None:
        config = update_configuracion_usuario(db, config_id, dto, usuario_id)
        if not config:
            return None
        return ConfigUsuarioOut.model_validate(config)

    @staticmethod
    def delete_configuracion_usuario(db: Session, config_id: int, usuario_id: int) -> bool:
        return delete_configuracion_usuario(db, config_id, usuario_id)
