from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.usuarios import Usuario
from app.models.roles import RoleType
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import UserRegister, UserUpdate, GoogleUserInfo
from app.services.role_service import RoleService


class UserService:
    """Servicio para gestión de usuarios"""
    
    @staticmethod
    def is_trial_expired(user: Usuario) -> bool:
        """Verifica si el trial del usuario ha expirado"""
        if user.plan != "trial":
            return False  # No es trial, no puede expirar
        
        if not user.fecha_vencimiento:
            return False  # No tiene fecha de vencimiento configurada
        
        return datetime.utcnow().date() > user.fecha_vencimiento
    
    @staticmethod
    def create_user(db: Session, user_data: UserRegister) -> Usuario:
        """Crear nuevo usuario con registro local"""
        # Hash de la contraseña
        hashed_password = get_password_hash(user_data.password)
        
        # Obtener rol de usuario por defecto
        user_role = RoleService.get_role_by_name(db, RoleType.user)
        
        # Crear usuario
        user = Usuario(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            nombre=user_data.nombre,
            apellido=user_data.apellido,
            telefono=user_data.telefono,
            especialidad=user_data.especialidad,
            plan="trial",  # Plan inicial
            fecha_inicio_plan=datetime.utcnow().date(),
            fecha_vencimiento=datetime.utcnow().date() + timedelta(days=14),  # Trial de 14 días
            provider="local",
            email_verificado=False,
            onboarding_completado=False,
            activo=True,
            role_id=user_role.id if user_role else None,  # Asignar rol "user" por defecto
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[Usuario]:
        """Obtener usuario por username"""
        return db.query(Usuario).filter(Usuario.username == username).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Usuario]:
        """Obtener usuario por email"""
        return db.query(Usuario).filter(Usuario.email == email).first()
    
    @staticmethod
    def get_by_google_id(db: Session, google_id: str) -> Optional[Usuario]:
        """Obtener usuario por Google ID"""
        return db.query(Usuario).filter(Usuario.google_id == google_id).first()
    
    @staticmethod
    def create_or_update_from_google(
        db: Session,
        google_info: GoogleUserInfo
    ) -> tuple[Usuario, bool]:
        """
        Crear o actualizar usuario desde Google OAuth
        
        Returns:
            (usuario, is_new) - is_new es True si el usuario fue creado
        """
        # Buscar usuario existente por Google ID
        user = UserService.get_by_google_id(db, google_info.google_id)
        
        if user:
            # Actualizar información si cambió
            user.avatar_url = google_info.avatar_url
            user.email_verificado = google_info.email_verified
            user.ultimo_acceso = datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user, False
        
        # Buscar por email (usuario podría haberse registrado antes con email)
        user = UserService.get_by_email(db, google_info.email)
        
        if user:
            # Vincular cuenta de Google
            user.google_id = google_info.google_id
            user.avatar_url = google_info.avatar_url
            user.email_verificado = google_info.email_verified
            user.provider = "google"
            user.ultimo_acceso = datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user, False
        
        # Crear nuevo usuario
        # Generar username único desde email
        username_base = google_info.email.split('@')[0]
        username = username_base
        counter = 1
        while UserService.get_by_username(db, username):
            username = f"{username_base}{counter}"
            counter += 1
        
        # Obtener rol de usuario por defecto
        user_role = RoleService.get_role_by_name(db, RoleType.user)
        
        user = Usuario(
            username=username,
            email=google_info.email,
            nombre=google_info.nombre,
            apellido=google_info.apellido,
            google_id=google_info.google_id,
            avatar_url=google_info.avatar_url,
            provider="google",
            email_verificado=google_info.email_verified,
            onboarding_completado=False,
            especialidad="odontologia",  # Default, cambiar en onboarding
            plan="trial",
            fecha_inicio_plan=datetime.utcnow().date(),
            fecha_vencimiento=datetime.utcnow().date() + timedelta(days=14),  # Trial de 14 días
            activo=True,
            role_id=user_role.id if user_role else None,  # Asignar rol "user" por defecto
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate) -> Usuario:
        """Actualizar usuario"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if user_data.nombre is not None:
            user.nombre = user_data.nombre
        if user_data.apellido is not None:
            user.apellido = user_data.apellido
        if user_data.telefono is not None:
            user.telefono = user_data.telefono
        if user_data.email is not None:
            user.email = user_data.email
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_ultimo_acceso(db: Session, user_id: int):
        """Actualizar última fecha de acceso"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if user:
            user.ultimo_acceso = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def complete_onboarding(
        db: Session,
        user_id: int,
        especialidad: Optional[str] = None,
        telefono: Optional[str] = None
    ) -> Usuario:
        """Marcar onboarding como completado"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if especialidad:
            user.especialidad = especialidad
        if telefono:
            user.telefono = telefono
        
        user.onboarding_completado = True
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def change_password(
        db: Session,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> bool:
        """Cambiar contraseña del usuario"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Verificar que el usuario tenga contraseña (no OAuth)
        if not user.password_hash:
            raise ValueError("User registered with OAuth, cannot change password")
        
        # Verificar contraseña actual
        if not verify_password(current_password, user.password_hash):
            return False
        
        # Actualizar contraseña
        user.password_hash = get_password_hash(new_password)
        db.commit()
        return True

