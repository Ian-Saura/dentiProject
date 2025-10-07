from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.repositories import (
    count_pacientes,
    create_paciente,
    delete_paciente,
    get_paciente,
    list_pacientes,
    update_paciente,
)
from app.schemas import PacienteCreate, PacienteOut, PacienteUpdate
from app.models import Paciente


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
    
    @staticmethod
    def find_or_create_paciente(
        db: Session, 
        nombre: str, 
        apellido: str, 
        dni: str, 
        usuario_id: int
    ) -> Paciente:
        """
        Find existing patient by DNI or create new one.
        DNI is now MANDATORY and used as the unique identifier.
        
        Args:
            db: Database session
            nombre: Patient first name
            apellido: Patient last name
            dni: Patient DNI (REQUIRED)
            usuario_id: User ID
            
        Returns:
            Paciente: Existing or newly created patient
        
        Raises:
            ValueError: If DNI is not provided or invalid
        """
        # Clean inputs
        nombre = nombre.strip()
        apellido = apellido.strip()
        dni_clean = dni.strip()
        
        if not dni_clean or len(dni_clean) < 7:
            raise ValueError("DNI es obligatorio y debe tener al menos 7 caracteres")
        
        # Find by DNI (unique identifier)
        existing = db.query(Paciente).filter(
            Paciente.usuario_id == usuario_id,
            func.lower(func.trim(Paciente.dni)) == dni_clean.lower()
        ).first()
        
        if existing:
            # Update name if it changed
            if existing.nombre != nombre or existing.apellido != apellido:
                existing.nombre = nombre
                existing.apellido = apellido
                db.commit()
            return existing
        
        # Create new patient with DNI
        paciente_dto = PacienteCreate(
            nombre=nombre,
            apellido=apellido,
            dni=dni_clean
        )
        
        return create_paciente(db, paciente_dto, usuario_id)
    
    @staticmethod
    def merge_pacientes(
        db: Session,
        paciente_principal_id: int,
        paciente_duplicado_id: int,
        usuario_id: int
    ) -> PacienteOut | None:
        """
        Merge duplicate patient into principal patient.
        Moves all consultas from duplicate to principal and deletes duplicate.
        
        Args:
            db: Database session
            paciente_principal_id: ID of patient to keep
            paciente_duplicado_id: ID of patient to merge and delete
            usuario_id: User ID (for security)
            
        Returns:
            PacienteOut: Updated principal patient or None if error
        """
        from app.models import Consulta
        
        # Verify both patients belong to user
        principal = db.query(Paciente).filter(
            Paciente.id == paciente_principal_id,
            Paciente.usuario_id == usuario_id
        ).first()
        
        duplicado = db.query(Paciente).filter(
            Paciente.id == paciente_duplicado_id,
            Paciente.usuario_id == usuario_id
        ).first()
        
        if not principal or not duplicado:
            return None
        
        # Move all consultas from duplicate to principal
        db.query(Consulta).filter(
            Consulta.paciente_id == paciente_duplicado_id
        ).update({"paciente_id": paciente_principal_id})
        
        # Update principal patient with any missing data from duplicate
        if not principal.dni or principal.dni.startswith('CSV'):
            if duplicado.dni and not duplicado.dni.startswith('CSV'):
                principal.dni = duplicado.dni
        
        if not principal.telefono and duplicado.telefono:
            principal.telefono = duplicado.telefono
        
        if not principal.email and duplicado.email:
            principal.email = duplicado.email
        
        if not principal.fecha_nacimiento and duplicado.fecha_nacimiento:
            principal.fecha_nacimiento = duplicado.fecha_nacimiento
        
        if not principal.direccion and duplicado.direccion:
            principal.direccion = duplicado.direccion
        
        if not principal.obra_social and duplicado.obra_social:
            principal.obra_social = duplicado.obra_social
        
        # Delete duplicate patient
        db.delete(duplicado)
        db.commit()
        db.refresh(principal)
        
        return PacienteOut.model_validate(principal)
