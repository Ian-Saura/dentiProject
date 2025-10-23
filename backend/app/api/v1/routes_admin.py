from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.deps.permissions import is_admin
from app.models.usuarios import Usuario
from app.models.roles import Role, RoleType
from app.schemas.auth import UserResponse, AdminResetPasswordRequest
from app.services.role_service import RoleService
from app.services.auditoria import AuditoriaService
from app.services.password_reset import PasswordResetService

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
    fecha_inicio_plan: str | None
    fecha_vencimiento: str | None
    dias_restantes: int | None
    trial_expirado: bool
    ultima_verificacion_pago: str | None
    pago_verificado: bool
    necesita_verificacion: bool  # True si pasaron más de 30 días desde última verificación
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
    from datetime import date, timedelta
    
    query = db.query(Usuario)
    
    if activo is not None:
        query = query.filter(Usuario.activo == activo)
    
    users = query.offset(skip).limit(limit).all()
    today = date.today()
    
    result = []
    for user in users:
        # Calcular días restantes y si el trial expiró
        dias_restantes = None
        trial_expirado = False
        
        if user.fecha_vencimiento:
            dias_restantes = (user.fecha_vencimiento - today).days
            if user.plan.value == 'trial' and dias_restantes < 0:
                trial_expirado = True
        
        # Verificar si necesita verificación de pago (más de 30 días desde última verificación)
        necesita_verificacion = False
        if user.plan.value != 'trial':  # Solo para planes de pago
            if user.ultima_verificacion_pago:
                dias_desde_verificacion = (today - user.ultima_verificacion_pago).days
                necesita_verificacion = dias_desde_verificacion >= 30
            else:
                # Si nunca se verificó y el plan no es trial, necesita verificación
                necesita_verificacion = True
        
        result.append(UserWithRole(
            id=user.id,
            username=user.username,
            email=user.email,
            nombre=user.nombre,
            apellido=user.apellido,
            especialidad=user.especialidad.value,
            plan=user.plan.value,
            fecha_inicio_plan=user.fecha_inicio_plan.isoformat() if user.fecha_inicio_plan else None,
            fecha_vencimiento=user.fecha_vencimiento.isoformat() if user.fecha_vencimiento else None,
            dias_restantes=dias_restantes,
            trial_expirado=trial_expirado,
            ultima_verificacion_pago=user.ultima_verificacion_pago.isoformat() if user.ultima_verificacion_pago else None,
            pago_verificado=user.pago_verificado,
            necesita_verificacion=necesita_verificacion,
            activo=user.activo,
            fecha_registro=user.fecha_registro.isoformat(),
            role_name=user.role.name.value if user.role else None,
            role_display_name=user.role.display_name if user.role else None,
        ))
    
    return result


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



# ============================================================================
# PLAN MANAGEMENT
# ============================================================================

@router.post("/users/{user_id}/assign-plan")
def assign_user_plan(
    user_id: int,
    plan_request: dict,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """
    Asignar plan a un usuario (solo admin/moderator)
    """
    from app.schemas.auth import AssignPlanRequest
    from app.services.plan_service import PlanService
    from datetime import timedelta, date as date_type
    
    # Validar el request
    try:
        validated_request = AssignPlanRequest(**plan_request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Get user
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Assign plan
    updated_user = PlanService.assign_plan(
        db=db,
        user=user,
        plan=validated_request.plan,
        dias_duracion=validated_request.dias_duracion
    )
    
    # Log action (usando actualizar en lugar de asignar_plan por ahora)
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="actualizar",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Plan asignado: {validated_request.plan}",
        metadata={"plan": validated_request.plan, "dias_duracion": validated_request.dias_duracion},
        exitoso=True
    )
    
    plan_status = PlanService.get_plan_status(updated_user)
    
    return {
        "success": True,
        "message": f"Plan {validated_request.plan} asignado correctamente",
        "user": {
            "id": updated_user.id,
            "username": updated_user.username,
            "email": updated_user.email,
            "plan": updated_user.plan.value,
        },
        "plan_status": plan_status
    }


@router.get("/users/{user_id}/plan-status")
def get_user_plan_status(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener estado del plan de un usuario (solo admin/moderator)
    """
    from app.services.plan_service import PlanService
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return PlanService.get_plan_status(user)


@router.post("/users/{user_id}/verify-payment")
def verify_user_payment(
    user_id: int,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """
    Marcar el pago de un usuario como verificado (solo admin)
    Esto resetea el contador de 30 días para la próxima verificación
    """
    from datetime import date
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Actualizar campos de verificación
    user.pago_verificado = True
    user.ultima_verificacion_pago = date.today()
    db.commit()
    
    # Log de auditoría (usando actualizar temporalmente hasta que se agregue verificar_pago al enum)
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="actualizar",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Pago verificado para {user.username}",
        metadata={"fecha_verificacion": date.today().isoformat()},
        exitoso=True
    )
    
    return {
        "success": True,
        "message": f"Pago verificado para {user.username}",
        "user": {
            "id": user.id,
            "username": user.username,
            "ultima_verificacion_pago": user.ultima_verificacion_pago.isoformat(),
            "pago_verificado": user.pago_verificado
        }
    }


# ============================================================================
# ADMIN USER MANAGEMENT TOOLS
# ============================================================================

@router.post("/users/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: int,
    password_data: AdminResetPasswordRequest,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """
    Admin puede resetear la contraseña de cualquier usuario
    """
    # Buscar usuario
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Prevenir que se resetee la contraseña del propio admin sin confirmación
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes resetear tu propia contraseña desde aquí. Usa 'Cambiar Contraseña' en tu perfil."
        )
    
    # Resetear contraseña
    success = PasswordResetService.admin_reset_password(db, user_id, password_data.new_password)
    
    if not success:
        raise HTTPException(status_code=500, detail="Error al resetear contraseña")
    
    # Log de auditoría
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="actualizar",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Admin reseteó contraseña de {user.username}",
        exitoso=True
    )
    
    return {
        "success": True,
        "message": f"Contraseña reseteada exitosamente para {user.username}",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


@router.get("/users/{user_id}/stats")
def get_user_stats(
    user_id: int,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """
    Obtener estadísticas de un usuario (para admin)
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Contar pacientes, consultas, etc
    from app.models import Paciente, Consulta
    
    total_pacientes = db.query(Paciente).filter(Paciente.usuario_id == user_id).count()
    total_consultas = db.query(Consulta).filter(Consulta.usuario_id == user_id).count()
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "email": user.email,
            "especialidad": user.especialidad,
            "activo": user.activo,
            "plan": user.plan.value if user.plan else None,
            "fecha_registro": user.fecha_registro.isoformat() if user.fecha_registro else None
        },
        "stats": {
            "total_pacientes": total_pacientes,
            "total_consultas": total_consultas,
        }
    }


@router.post("/users/{user_id}/impersonate")
def impersonate_user(
    user_id: int,
    current_user: Usuario = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """
    Permite al admin autenticarse como otro usuario (impersonación)
    """
    # Buscar usuario
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir impersonar a otro admin
    if user.role and user.role.name == RoleType.admin:
        raise HTTPException(
            status_code=403,
            detail="No se puede impersonar a otro administrador"
        )
    
    # Crear token para el usuario impersonado
    from app.core.security import create_access_token
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=60 * 24)  # 24 horas
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Log de auditoría
    AuditoriaService.log_action(
        db=db,
        usuario_id=current_user.id,
        accion="leer",
        entidad_tipo="usuario",
        entidad_id=user_id,
        descripcion=f"Admin {current_user.username} impersonó a {user.username}",
        exitoso=True
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "especialidad": user.especialidad,
            "plan": user.plan.value if user.plan else None,
            "activo": user.activo
        }
    }
