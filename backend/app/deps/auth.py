from __future__ import annotations

from typing import Generator

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWTError
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Usuario

settings = get_settings()
security = HTTPBearer()


def get_current_user(
    request: Request = None,  # Optional for middleware
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    # Load user with role relationship eagerly
    user = db.query(Usuario).options(joinedload(Usuario.role)).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception

    # Set user_id in request state for logging
    if request:
        request.state.user_id = str(user.id)

    return user
