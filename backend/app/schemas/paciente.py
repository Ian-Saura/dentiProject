from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


class PacienteCreate(BaseModel):
    nombre: str = Field(..., max_length=100)
    apellido: str = Field(..., max_length=100)
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

    class Config:
        model_config = {"extra": "forbid"}


class PacienteUpdate(BaseModel):
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

    class Config:
        model_config = {"extra": "forbid"}


class PacienteOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    dni: Optional[str]
    fecha_nacimiento: Optional[date]
    telefono: Optional[str]
    email: Optional[EmailStr]
    direccion: Optional[str]
    obra_social: Optional[str]
    numero_afiliado: Optional[str]
    contacto_emergencia: Optional[str]
    alergias: Optional[str]
    medicamentos_actuales: Optional[str]
    observaciones_medicas: Optional[str]
    fecha_registro: datetime  # Changed from date to datetime to match model
    activo: bool

    class Config:
        from_attributes = True
        model_config = {"exclude_none": True}
