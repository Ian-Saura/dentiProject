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


class UserResponse(BaseModel):
    """Respuesta con datos del usuario"""
    id: int
    username: str
    email: Optional[str]
    nombre: str
    apellido: Optional[str]
    telefono: Optional[str]
    especialidad: str
    plan: str
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime]
    activo: bool
    avatar_url: Optional[str]
    provider: Optional[str]
    onboarding_completado: bool
    email_verificado: bool
    role_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Actualizar perfil de usuario"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


# ============================================================================
# GOOGLE OAUTH
# ============================================================================

class GoogleAuthRequest(BaseModel):
    """Request con token de Google"""
    credential: str = Field(..., description="Google ID token or credential")
    token: Optional[str] = Field(None, description="Alternative field name")


class GoogleUserInfo(BaseModel):
    """Información del usuario de Google"""
    google_id: str
    email: str
    nombre: str
    apellido: Optional[str]
    avatar_url: Optional[str]
    email_verified: bool


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
# PLAN MANAGEMENT
# ============================================================================

class AssignPlanRequest(BaseModel):
    """Asignar plan a un usuario"""
    plan: str = Field(..., description="trial, premium, o enterprise")
    dias_trial: Optional[int] = Field(7, description="Días de trial (solo para plan trial)")
    
    @validator('plan')
    def validate_plan(cls, v):
        allowed = ['trial', 'premium', 'enterprise']
        if v not in allowed:
            raise ValueError(f'Plan must be one of: {", ".join(allowed)}')
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
