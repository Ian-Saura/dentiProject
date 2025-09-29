from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories import (
    count_pacientes,
    create_paciente,
    delete_paciente,
    get_paciente,
    list_pacientes,
    update_paciente,
)
from app.schemas import PacienteCreate, PacienteOut, PacienteUpdate


class PacientesService:
    @staticmethod
    def list_pacientes(
        db: Session,
        usuario_id: int,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: dict = None,
    ) -> tuple[list[PacienteOut], int]:
        pacientes = list_pacientes(
            db, usuario_id, limit=limit, offset=offset, order_by=order_by, filtros=filtros
        )
        total = count_pacientes(db, usuario_id, filtros=filtros)
        return [PacienteOut.model_validate(paciente) for paciente in pacientes], total

    @staticmethod
    def get_paciente(db: Session, paciente_id: int, usuario_id: int) -> PacienteOut | None:
        paciente = get_paciente(db, paciente_id, usuario_id)
        if not paciente:
            return None
        return PacienteOut.model_validate(paciente)

    @staticmethod
    def create_paciente(db: Session, dto: PacienteCreate, usuario_id: int) -> PacienteOut:
        paciente = create_paciente(db, dto, usuario_id)
        return PacienteOut.model_validate(paciente)

    @staticmethod
    def update_paciente(
        db: Session, paciente_id: int, dto: PacienteUpdate, usuario_id: int
    ) -> PacienteOut | None:
        paciente = update_paciente(db, paciente_id, dto, usuario_id)
        if not paciente:
            return None
        return PacienteOut.model_validate(paciente)

    @staticmethod
    def delete_paciente(db: Session, paciente_id: int, usuario_id: int) -> bool:
        return delete_paciente(db, paciente_id, usuario_id)
