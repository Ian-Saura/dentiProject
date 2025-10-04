from __future__ import annotations

from typing import List

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import get_current_user
from app.models.usuarios import Usuario
from app.models.roles import PermissionType, RoleType


def has_permission(required_permissions: List[PermissionType]):
    """
    Dependency para verificar si el usuario actual tiene los permisos requeridos.
    
    Usage:
        @router.get("/admin/users", dependencies=[Depends(has_permission([PermissionType.view_users]))])
        async def get_users():
            ...
    """
    async def permission_checker(
        current_user: Usuario = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Super admin bypass
        if current_user.role and current_user.role.name == RoleType.admin:
            return current_user
        
        # Check if user has role
        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned"
            )
        
        # Check permissions
        user_permissions = {perm.name for perm in current_user.role.permissions}
        required_perms_set = set(required_permissions)
        
        if not required_perms_set.issubset(user_permissions):
            missing_perms = required_perms_set - user_permissions
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join([p.value for p in missing_perms])}"
            )
        
        return current_user
    
    return permission_checker


def require_role(required_role: RoleType):
    """
    Dependency para verificar si el usuario tiene un rol específico.
    
    Usage:
        @router.get("/admin/dashboard", dependencies=[Depends(require_role(RoleType.admin))])
        async def admin_dashboard():
            ...
    """
    async def role_checker(
        current_user: Usuario = Depends(get_current_user)
    ):
        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned"
            )
        
        if current_user.role.name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_role.value}"
            )
        
        return current_user
    
    return role_checker


def is_admin(current_user: Usuario = Depends(get_current_user)):
    """
    Dependency simple para verificar si el usuario es admin.
    
    Usage:
        @router.get("/admin/users", dependencies=[Depends(is_admin)])
        async def get_users():
            ...
    """
    if not current_user.role or current_user.role.name != RoleType.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

