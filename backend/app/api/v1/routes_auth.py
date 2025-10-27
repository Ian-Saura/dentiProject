from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.models import Usuario
from app.schemas.auth import (
    Token,
    LoginResponse,
    UserRegister,
    UserResponse,
    UserUpdate,
    GoogleAuthRequest,
    OnboardingComplete,
    ChangePassword,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.user_service import UserService
from app.services.google_auth import GoogleAuthService
from app.services.auditoria import AuditoriaService
from app.services.password_reset import PasswordResetService

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================================
# LOCAL AUTH (Username/Password)
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Login con username/email y password"""
    # Allow login with either username or email
    user = db.query(Usuario).filter(
        or_(Usuario.username == form_data.username, Usuario.email == form_data.username)
    ).first()
    
    if not user or not user.password_hash:
        # Log failed login
        AuditoriaService.log_action(
            db=db,
            usuario_id=None,
            accion="login",
            entidad_tipo="usuario",
            descripcion=f"Login fallido: usuario '{form_data.username}' no encontrado",
            ip_address=request.client.host if request.client else None,
            exitoso=False,
            error_mensaje="Usuario no encontrado"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        # Log failed login
        AuditoriaService.log_action(
            db=db,
            usuario_id=user.id,
            accion="login",
            entidad_tipo="usuario",
            descripcion=f"Login fallido: contraseña incorrecta para '{form_data.username}'",
            ip_address=request.client.host if request.client else None,
            exitoso=False,
            error_mensaje="Contraseña incorrecta"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Actualizar último acceso
    UserService.update_ultimo_acceso(db, user.id)
    
    # Log successful login
    AuditoriaService.log_action(
        db=db,
        usuario_id=user.id,
        accion="login",
        entidad_tipo="usuario",
        descripcion=f"Login exitoso: {form_data.username}",
        ip_address=request.client.host if request.client else None,
        exitoso=True
    )

    access_token = create_access_token(subject=user.username)
    
    # Create user response with role_name
    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict['role_name'] = user.role.name.value if user.role else None
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict),
        requires_onboarding=not user.onboarding_completado
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    """Registrar nuevo usuario"""
    # Verificar que no exista el username
    if UserService.get_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Verificar que no exista el email
    if UserService.get_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Crear usuario
        user = UserService.create_user(db, user_data)
        
        # Log registro
        AuditoriaService.log_action(
            db=db,
            usuario_id=user.id,
            accion="registro",
            entidad_tipo="usuario",
            descripcion=f"Nuevo registro: {user.username}",
            ip_address=request.client.host if request.client else None,
            metadata={"email": user.email, "especialidad": user.especialidad},
            exitoso=True
        )
        
        # Crear token
        access_token = create_access_token(subject=user.username)
        
        # Create user response with role_name
        user_dict = UserResponse.model_validate(user).model_dump()
        user_dict['role_name'] = user.role.name.value if user.role else None
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(**user_dict),
            requires_onboarding=True  # Siempre true para nuevos usuarios
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration failed. Username or email might already exist."
        )


# ============================================================================
# GOOGLE OAUTH
# ============================================================================

@router.get("/google")
async def google_login():
    """Iniciar flujo de Google OAuth"""
    authorization_url = GoogleAuthService.get_authorization_url()
    return {"authorization_url": authorization_url}


@router.post("/google/token", response_model=LoginResponse)
async def google_auth(
    request: Request,
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Autenticación con Google (token exchange)"""
    # Verificar token de Google (prioritize credential field)
    token = auth_request.credential or auth_request.token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is required"
        )
    
    google_info = await GoogleAuthService.verify_token(token)
    
    if not google_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Crear o actualizar usuario
    user, is_new = UserService.create_or_update_from_google(db, google_info)
    
    # Log acción
    accion = "registro" if is_new else "login"
    AuditoriaService.log_action(
        db=db,
        usuario_id=user.id,
        accion=accion,
        entidad_tipo="usuario",
        descripcion=f"Google OAuth: {user.email}",
        ip_address=request.client.host if request.client else None,
        metadata={"provider": "google", "is_new_user": is_new},
        exitoso=True
    )
    
    # Crear token
    access_token = create_access_token(subject=user.username)
    
    # Create user response with role_name
    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict['role_name'] = user.role.name.value if user.role else None
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict),
        requires_onboarding=not user.onboarding_completado
    )


# ============================================================================
# USER PROFILE
# ============================================================================

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener información del usuario actual"""
    user_dict = UserResponse.model_validate(current_user).model_dump()
    user_dict['role_name'] = current_user.role.name.value if current_user.role else None
    return UserResponse(**user_dict)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar perfil del usuario"""
    user = UserService.update_user(db, current_user.id, user_data)
    
    # Log actualización
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="actualizar",
        entidad_tipo="usuario",
        entidad_id=current_user.id,
        descripcion="Actualización de perfil",
        exitoso=True
    )
    
    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict['role_name'] = user.role.name.value if user.role else None
    return UserResponse(**user_dict)


@router.post("/me/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cambiar contraseña del usuario"""
    success = UserService.change_password(
        db,
        current_user.id,
        password_data.current_password,
        password_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Log cambio de contraseña
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="cambio_password",
        entidad_tipo="usuario",
        entidad_id=current_user.id,
        descripcion="Cambio de contraseña exitoso",
        exitoso=True
    )
    
    return {"message": "Password changed successfully"}


# ============================================================================
# PASSWORD RESET
# ============================================================================

@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Solicitar reset de contraseña. Genera un código de 6 dígitos.
    Por seguridad, siempre retorna éxito aunque el email no exista.
    """
    reset_code = PasswordResetService.create_reset_token(db, request_data.email)
    
    if reset_code:
        # TODO: Aquí enviar el código por email
        # Por ahora, en desarrollo, lo retornamos (SOLO PARA TESTING)
        # En producción, solo enviar por email y retornar success
        return {
            "message": "Si el email existe, recibirás un código de verificación",
            "reset_code": reset_code  # REMOVER EN PRODUCCIÓN
        }
    
    # Siempre retornar éxito para no revelar si el email existe
    return {
        "message": "Si el email existe, recibirás un código de verificación"
    }


@router.post("/reset-password")
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Resetear contraseña usando código de verificación"""
    success = PasswordResetService.reset_password_with_code(
        db,
        reset_data.email,
        reset_data.reset_code,
        reset_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )
    
    # Log reset de contraseña
    from sqlalchemy import select
    stmt = select(Usuario).where(Usuario.email == reset_data.email)
    user = db.execute(stmt).scalar_one_or_none()
    
    if user:
        AuditoriaService.log_action(
            db=db,
            usuario_id=user.id,
            accion="cambio_password",
            entidad_tipo="usuario",
            entidad_id=user.id,
            descripcion="Reset de contraseña con código",
            exitoso=True
        )
    
    return {"message": "Contraseña restablecida exitosamente"}


# ============================================================================
# ONBOARDING
# ============================================================================

@router.post("/onboarding/complete", response_model=UserResponse)
async def complete_onboarding(
    onboarding_data: OnboardingComplete,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Completar proceso de onboarding"""
    user = UserService.complete_onboarding(
        db,
        current_user.id,
        onboarding_data.especialidad,
        onboarding_data.telefono
    )
    
    # Log onboarding completado
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="configurar",
        entidad_tipo="usuario",
        entidad_id=current_user.id,
        descripcion="Onboarding completado",
        metadata=onboarding_data.configuracion_inicial,
        exitoso=True
    )
    
    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict['role_name'] = user.role.name.value if user.role else None
    return UserResponse(**user_dict)
@router.get("/me/plan-status")
def get_my_plan_status(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener el estado del plan del usuario actual
    """
    from app.services.plan_service import PlanService
    return PlanService.get_plan_status(current_user)



