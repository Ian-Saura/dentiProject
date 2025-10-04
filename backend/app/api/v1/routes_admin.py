from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.deps.permissions import is_admin
from app.models.usuarios import Usuario
from app.models.roles import Role, RoleType
from app.schemas.auth import UserResponse
from app.services.role_service import RoleService
from app.services.auditoria import AuditoriaService

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(is_admin)])


# ============================================================================
# SCHEMAS
# ============================================================================

class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: str
    permissions_count: int
    
    class Config:
        from_attributes = True


class UserWithRole(BaseModel):
    id: int
    username: str
    email: str | None
    nombre: str
    apellido: str | None
    especialidad: str
    plan: str
    activo: bool
    fecha_registro: str
    role_name: str | None
    role_display_name: str | None
    
    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    user_id: int
    role: RoleType


class UpdateUserStatusRequest(BaseModel):
    activo: bool


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users", response_model=List[UserWithRole])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    activo: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """Lista todos los usuarios del sistema (Admin only)"""
    query = db.query(Usuario)
    
    if activo is not None:
        query = query.filter(Usuario.activo == activo)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        UserWithRole(
            id=user.id,
            username=user.username,
            email=user.email,
            nombre=user.nombre,
            apellido=user.apellido,
            especialidad=user.especialidad.value,
            plan=user.plan.value,
            activo=user.activo,
            fecha_registro=user.fecha_registro.isoformat(),
            role_name=user.role.name.value if user.role else None,
            role_display_name=user.role.display_name if user.role else None,
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Obtener detalles de un usuario específico"""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/assign-role")
async def assign_role_to_user(
    user_id: int,
    request: AssignRoleRequest,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """Asignar rol a un usuario"""
    if user_id != request.user_id:
        raise HTTPException(status_code=400, detail="User ID mismatch")
    
    # No permitir que el admin se quite su propio rol admin
    if user_id == current_user.id and request.role != RoleType.admin:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove admin role from yourself"
        )
    
    try:
        user = RoleService.assign_role_to_user(db, user_id, request.role)
        
        # Log de auditoría
        AuditoriaService.log_action(
            db=db,
            usuario_id=current_user.id,
            accion="actualizar",
            entidad_tipo="usuario",
            entidad_id=user_id,
            descripcion=f"Rol asignado: {request.role.value}",
            metadata={"new_role": request.role.value},
            exitoso=True
        )
        
        return {
            "message": f"Role {request.role.value} assigned successfully",
            "user": UserResponse.model_validate(user)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    request: UpdateUserStatusRequest,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """Activar/desactivar usuario"""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # No permitir desactivar el propio usuario
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate yourself"
        )
    
    user.activo = request.activo
    db.commit()
    
    # Log de auditoría
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="actualizar",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Usuario {'activado' if request.activo else 'desactivado'}",
        metadata={"activo": request.activo},
        exitoso=True
    )
    
    return {
        "message": f"User {'activated' if request.activo else 'deactivated'} successfully",
        "user": UserResponse.model_validate(user)
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """Eliminar usuario (Admin only)"""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # No permitir eliminar el propio usuario
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete yourself"
        )
    
    username = user.username
    db.delete(user)
    db.commit()
    
    # Log de auditoría
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="eliminar",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Usuario eliminado: {username}",
        exitoso=True
    )
    
    return {"message": f"User {username} deleted successfully"}


# ============================================================================
# ROLES MANAGEMENT
# ============================================================================

@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    db: Session = Depends(get_db),
):
    """Lista todos los roles disponibles"""
    roles = RoleService.get_all_roles(db)
    
    return [
        RoleResponse(
            id=role.id,
            name=role.name.value,
            display_name=role.display_name,
            description=role.description,
            permissions_count=len(role.permissions)
        )
        for role in roles
    ]


@router.get("/roles/{role_id}/permissions")
async def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
):
    """Obtener permisos de un rol específico"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {
        "role": RoleResponse(
            id=role.id,
            name=role.name.value,
            display_name=role.display_name,
            description=role.description,
            permissions_count=len(role.permissions)
        ),
        "permissions": [
            {
                "name": perm.name.value,
                "display_name": perm.display_name,
                "description": perm.description
            }
            for perm in role.permissions
        ]
    }


# ============================================================================
# STATISTICS
# ============================================================================

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
):
    """Obtener estadísticas del sistema"""
    total_users = db.query(Usuario).count()
    active_users = db.query(Usuario).filter(Usuario.activo == True).count()
    inactive_users = total_users - active_users
    
    # Usuarios por rol
    users_by_role = {}
    for role in RoleService.get_all_roles(db):
        count = db.query(Usuario).filter(Usuario.role_id == role.id).count()
        users_by_role[role.name.value] = count
    
    # Usuarios sin rol
    users_without_role = db.query(Usuario).filter(Usuario.role_id == None).count()
    
    # Usuarios por plan
    from sqlalchemy import func
    from app.models.usuarios import Plan
    users_by_plan = {}
    for plan in Plan:
        count = db.query(Usuario).filter(Usuario.plan == plan).count()
        users_by_plan[plan.value] = count
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "users_by_role": users_by_role,
        "users_without_role": users_without_role,
        "users_by_plan": users_by_plan,
    }

