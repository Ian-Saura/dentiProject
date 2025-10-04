from __future__ import annotations

import enum
from typing import List

from sqlalchemy import Column, Enum, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RoleType(str, enum.Enum):
    """Tipos de roles en el sistema"""
    admin = "admin"           # Acceso completo al sistema
    user = "user"             # Usuario normal con acceso a su propia data
    viewer = "viewer"         # Solo lectura
    moderator = "moderator"   # Puede gestionar otros usuarios


class PermissionType(str, enum.Enum):
    """Permisos específicos del sistema"""
    # User Management
    view_users = "view_users"
    create_users = "create_users"
    edit_users = "edit_users"
    delete_users = "delete_users"
    assign_roles = "assign_roles"
    
    # Data Access
    view_own_data = "view_own_data"
    edit_own_data = "edit_own_data"
    view_all_data = "view_all_data"
    edit_all_data = "edit_all_data"
    delete_any_data = "delete_any_data"
    
    # Analytics
    view_analytics = "view_analytics"
    view_audit_logs = "view_audit_logs"
    
    # Configuration
    manage_system_config = "manage_system_config"
    manage_app_settings = "manage_app_settings"


# Many-to-Many table for Role-Permission relationship
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)


class Role(Base):
    """Modelo de Roles"""
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[RoleType] = mapped_column(Enum(RoleType), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    
    # Relationships
    permissions: Mapped[List["Permission"]] = relationship(
        secondary=role_permissions,
        back_populates="roles"
    )
    usuarios: Mapped[List["Usuario"]] = relationship(back_populates="role")


class Permission(Base):
    """Modelo de Permisos"""
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[PermissionType] = mapped_column(Enum(PermissionType), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        secondary=role_permissions,
        back_populates="permissions"
    )


# Import Usuario to establish relationship
from app.models.usuarios import Usuario  # noqa: E402

