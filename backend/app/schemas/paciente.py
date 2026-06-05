from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class PacienteCreate(BaseModel):
    model_config = {"extra": "forbid"}

    nombre: str = Field(..., max_length=100)
    apellido: str = Field(..., max_length=100)
    dni: str = Field(..., min_length=7, max_length=20, description="DNI obligatorio como identificador único")
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=500)
    obra_social: Optional[str] = Field(None, max_length=100)
    numero_afiliado: Optional[str] = Field(None, max_length=50)
    contacto_emergencia: Optional[str] = Field(None, max_length=200)
    alergias: Optional[str] = Field(None, max_length=1000)
    medicamentos_actuales: Optional[str] = Field(None, max_length=1000)
    observaciones_medicas: Optional[str] = Field(None, max_length=1000)


class PacienteUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    nombre: Optional[str] = Field(None, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    dni: Optional[str] = Field(None, max_length=20)
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=500)
    obra_social: Optional[str] = Field(None, max_length=100)
    numero_afiliado: Optional[str] = Field(None, max_length=50)
    contacto_emergencia: Optional[str] = Field(None, max_length=200)
    alergias: Optional[str] = Field(None, max_length=1000)
    medicamentos_actuales: Optional[str] = Field(None, max_length=1000)
    observaciones_medicas: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None


class PacienteOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    dni: str
    fecha_nacimiento: Optional[date]
    telefono: Optional[str]
    email: Optional[str]  # Changed from EmailStr to str to allow empty strings
    direccion: Optional[str]
    obra_social: Optional[str]
    numero_afiliado: Optional[str]
    contacto_emergencia: Optional[str]
    alergias: Optional[str]
    medicamentos_actuales: Optional[str]
    observaciones_medicas: Optional[str]
    fecha_registro: datetime  # Changed from date to datetime to match model
    activo: bool

    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        """Allow empty strings or None for email"""
        if v is None or v == '' or (isinstance(v, str) and v.strip() == ''):
            return None
        if isinstance(v, str) and '@' not in v:
            raise ValueError('Email debe contener @')
        return v

    model_config = {"from_attributes": True}
