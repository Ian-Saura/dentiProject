from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import ConfigUsuarioCreate, ConfigUsuarioOut, ConfigUsuarioUpdate
from app.services import ConfiguracionUsuarioService

router = APIRouter(prefix="/configuracion", tags=["configuracion"])


@router.get("/", response_model=ConfigUsuarioOut)
def get_config(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    config = ConfiguracionUsuarioService.get_config_by_usuario(db, tenant.user_id)
    if not config:
        # Create default config if not found
        from app.schemas import ConfigUsuarioCreate
        default_config = ConfigUsuarioCreate(
            costo_hora_manual_ars=None,
            usar_costo_manual=False,
            horas_anuales_trabajadas=1100
        )
        config = ConfiguracionUsuarioService.create_configuracion_usuario(db, default_config, tenant.user_id)
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


@router.put("/", response_model=ConfigUsuarioOut)
def update_config(
    config: ConfigUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    # Check if config exists
    existing = ConfiguracionUsuarioService.get_config_by_usuario(db, tenant.user_id)
    if existing:
        updated = ConfiguracionUsuarioService.update_configuracion_usuario(db, existing.id, config, tenant.user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Config not found")
        return updated
    else:
        # Create if doesn't exist
        from app.schemas import ConfigUsuarioCreate
        create_dto = ConfigUsuarioCreate(
            costo_hora_manual_ars=config.costo_hora_manual_ars,
            usar_costo_manual=config.usar_costo_manual if config.usar_costo_manual is not None else False,
            horas_anuales_trabajadas=config.horas_anuales_trabajadas if config.horas_anuales_trabajadas is not None else 1100
        )
        return ConfiguracionUsuarioService.create_configuracion_usuario(db, create_dto, tenant.user_id)


@router.patch("/", response_model=ConfigUsuarioOut)
def patch_config(
    config: ConfigUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    existing = ConfiguracionUsuarioService.get_config_by_usuario(db, tenant.user_id)
    if existing:
        updated = ConfiguracionUsuarioService.update_configuracion_usuario(db, existing.id, config, tenant.user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Config not found")
        return updated
    else:
        # Create default config and then update
        from app.schemas import ConfigUsuarioCreate
        create_dto = ConfigUsuarioCreate(
            costo_hora_manual_ars=0.0,
            usar_costo_manual=False,
            horas_anuales_trabajadas=1100
        )
        created = ConfiguracionUsuarioService.create_configuracion_usuario(db, create_dto, tenant.user_id)
        # Now update with the provided values
        updated = ConfiguracionUsuarioService.update_configuracion_usuario(db, created.id, config, tenant.user_id)
        return updated if updated else created

