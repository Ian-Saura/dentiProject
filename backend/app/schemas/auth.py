from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


# ============================================================================
# USER REGISTRATION
# ============================================================================

class UserRegister(BaseModel):
    """Schema para registro de nuevos usuarios"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    especialidad: str = Field(..., description="odontologia, dermatologia, kinesiologia")
    
    @validator('password')
    def validate_password(cls, v):
        """Validar que la contraseña sea segura"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v
    
    @validator('especialidad')
    def validate_especialidad(cls, v):
        allowed = ['odontologia', 'dermatologia', 'kinesiologia']
        if v not in allowed:
            raise ValueError(f'Especialidad must be one of: {", ".join(allowed)}')
        return v


class GoogleUserInfo(BaseModel):
    """Schema para información de usuario de Google OAuth"""
    google_id: str
    email: str
    nombre: str
    apellido: str
    avatar_url: Optional[str] = None
    email_verified: bool = False


class UserResponse(BaseModel):
    """Respuesta con datos del usuario"""
    id: int
    username: str
    email: Optional[str] = None
    nombre: str
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    especialidad: str
    activo: bool = True
    role_name: Optional[str] = None
    role_display_name: Optional[str] = None
    plan: Optional[str] = None
    onboarding_completado: bool = False
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema para actualizar perfil de usuario"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    especialidad: Optional[str] = None
    
    @validator('especialidad')
    def validate_especialidad(cls, v):
        if v is not None:
            allowed = ['odontologia', 'dermatologia', 'kinesiologia']
            if v not in allowed:
                raise ValueError(f'Especialidad must be one of: {", ".join(allowed)}')
        return v


# ============================================================================
# GOOGLE OAUTH
# ============================================================================

class GoogleAuthRequest(BaseModel):
    """Request para autenticación con Google"""
    token: Optional[str] = None  # ID token de Google
    credential: Optional[str] = None  # Credential from Google One Tap


# ============================================================================
# ONBOARDING
# ============================================================================

class OnboardingComplete(BaseModel):
    """Marcar onboarding como completado"""
    especialidad: Optional[str] = None
    telefono: Optional[str] = None
    configuracion_inicial: Optional[dict] = None


# ============================================================================
# AUTH RESPONSES
# ============================================================================

class Token(BaseModel):
    """Response de autenticación exitosa"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(BaseModel):
    """Response completo de login"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    requires_onboarding: bool = False


# ============================================================================
# CHANGE PASSWORD
# ============================================================================

class ChangePassword(BaseModel):
    """Cambiar contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v
# ============================================================================
# PASSWORD RESET
# ============================================================================

class ForgotPasswordRequest(BaseModel):
    """Request para solicitar reset de contraseña"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request para resetear contraseña con código"""
    email: EmailStr
    reset_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


class AdminResetPasswordRequest(BaseModel):
    """Admin puede resetear password de cualquier usuario"""
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


# ============================================================================
# PLAN MANAGEMENT
# ============================================================================

class AssignPlanRequest(BaseModel):
    """Asignar plan a un usuario"""
    plan: str = Field(..., description="trial, premium, o enterprise")
    dias_duracion: Optional[int] = Field(None, description="Días de duración del plan (opcional, si no se especifica el plan no expira)")
    
    @validator('plan')
    def validate_plan(cls, v):
        allowed = ['trial', 'premium', 'enterprise']
        if v not in allowed:
            raise ValueError(f'Plan must be one of: {", ".join(allowed)}')
        return v
    
    @validator('dias_duracion')
    def validate_dias_duracion(cls, v):
        if v is not None and v < 1:
            raise ValueError('dias_duracion debe ser mayor a 0')
        return v


class PlanStatusResponse(BaseModel):
    """Respuesta con estado del plan"""
    plan: str
    fecha_inicio_plan: Optional[str]
    fecha_vencimiento: Optional[str]
    dias_restantes: Optional[int]
    trial_expirado: bool
    puede_usar_app: bool
    mensaje: Optional[str]
    
    class Config:
        from_attributes = True


