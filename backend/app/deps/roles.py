from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.deps.auth import get_current_user
from app.models import Usuario


def require_roles(*roles: str):
    """Dependency to require specific roles. For now, allow all CRUD operations."""
    def role_checker(user: Usuario = Depends(get_current_user)):
        # Placeholder: currently allow all
        # In future, check user.plan or roles
        return user
    return role_checker
