from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import ConfigUsuarioCreate, ConfigUsuarioOut, ConfigUsuarioUpdate
from app.services import ConfiguracionUsuarioService

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/", response_model=ConfigUsuarioOut)
def get_config(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    config = ConfiguracionUsuarioService.get_config_by_usuario(db, tenant.user_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


@router.post("/", response_model=ConfigUsuarioOut)
def create_config(
    config: ConfigUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    return ConfiguracionUsuarioService.create_configuracion_usuario(db, config, tenant.user_id)


@router.patch("/", response_model=ConfigUsuarioOut)
def update_config(
    config: ConfigUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    # Assume config exists or create if not
    existing = ConfiguracionUsuarioService.get_config_by_usuario(db, tenant.user_id)
    if existing:
        updated = ConfiguracionUsuarioService.update_configuracion_usuario(db, existing.id, config, tenant.user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Config not found")
        return updated
    else:
        return ConfiguracionUsuarioService.create_configuracion_usuario(db, config, tenant.user_id)
