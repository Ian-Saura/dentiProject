"""Dependency para verificar si el trial del usuario ha expirado"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.auth import get_current_user
from app.db.session import get_db
from app.models import Usuario
from app.services.user_service import UserService


async def check_trial_status(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Verifica si el trial del usuario ha expirado.
    Si expiró, lanza una excepción HTTP 402 (Payment Required).
    """
    if UserService.is_trial_expired(current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Tu período de prueba ha expirado",
                "trial_expired": True,
                "fecha_vencimiento": current_user.fecha_vencimiento.isoformat() if current_user.fecha_vencimiento else None
            }
        )
    
    return current_user


