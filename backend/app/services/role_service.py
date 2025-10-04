from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.roles import Role, Permission, RoleType, PermissionType
from app.models.usuarios import Usuario


class RoleService:
    """Servicio para gestión de roles y permisos"""
    
    @staticmethod
    def initialize_roles_and_permissions(db: Session):
        """
        Inicializar roles y permisos por defecto del sistema.
        Debe ejecutarse al iniciar la aplicación.
        """
        # Crear permisos si no existen
        permissions = {}
        for perm_type in PermissionType:
            perm = db.query(Permission).filter(Permission.name == perm_type).first()
            if not perm:
                perm = Permission(
                    name=perm_type,
                    display_name=perm_type.value.replace('_', ' ').title(),
                    description=f"Permission to {perm_type.value}"
                )
                db.add(perm)
                db.flush()
            permissions[perm_type] = perm
        
        # Definir roles y sus permisos
        role_definitions = {
            RoleType.admin: {
                "display_name": "Administrator",
                "description": "Full system access",
                "permissions": list(PermissionType)  # All permissions
            },
            RoleType.user: {
                "display_name": "User",
                "description": "Standard user with access to own data",
                "permissions": [
                    PermissionType.view_own_data,
                    PermissionType.edit_own_data,
                ]
            },
            RoleType.viewer: {
                "display_name": "Viewer",
                "description": "Read-only access",
                "permissions": [
                    PermissionType.view_own_data,
                ]
            },
            RoleType.moderator: {
                "display_name": "Moderator",
                "description": "Can manage users but not system config",
                "permissions": [
                    PermissionType.view_users,
                    PermissionType.edit_users,
                    PermissionType.view_own_data,
                    PermissionType.edit_own_data,
                    PermissionType.view_analytics,
                ]
            }
        }
        
        # Crear o actualizar roles
        for role_type, role_data in role_definitions.items():
            role = db.query(Role).filter(Role.name == role_type).first()
            if not role:
                role = Role(
                    name=role_type,
                    display_name=role_data["display_name"],
                    description=role_data["description"]
                )
                db.add(role)
                db.flush()
            
            # Asignar permisos al rol
            role.permissions = [permissions[perm] for perm in role_data["permissions"]]
        
        db.commit()
        print("✅ Roles and permissions initialized successfully!")
    
    @staticmethod
    def get_role_by_name(db: Session, role_name: RoleType) -> Optional[Role]:
        """Obtener rol por nombre"""
        return db.query(Role).filter(Role.name == role_name).first()
    
    @staticmethod
    def assign_role_to_user(db: Session, user_id: int, role: RoleType):
        """Asignar rol a usuario"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        role_obj = RoleService.get_role_by_name(db, role)
        if not role_obj:
            raise ValueError("Role not found")
        
        user.role_id = role_obj.id
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_all_roles(db: Session) -> List[Role]:
        """Obtener todos los roles"""
        return db.query(Role).all()
    
    @staticmethod
    def get_user_permissions(user: Usuario) -> List[PermissionType]:
        """Obtener lista de permisos de un usuario"""
        if not user.role:
            return []
        return [perm.name for perm in user.role.permissions]
    
    @staticmethod
    def user_has_permission(user: Usuario, permission: PermissionType) -> bool:
        """Verificar si usuario tiene un permiso específico"""
        if not user.role:
            return False
        
        # Admin tiene todos los permisos
        if user.role.name == RoleType.admin:
            return True
        
        return permission in [perm.name for perm in user.role.permissions]

