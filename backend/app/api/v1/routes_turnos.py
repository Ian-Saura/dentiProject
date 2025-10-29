from __future__ import annotations

from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas.turnos import (
    TurnoCreate,
    TurnoUpdate,
    TurnoResponse,
    TurnoCreatePublic,
    TurnoResponsePublic,
    ConfiguracionTurnosCreate,
    ConfiguracionTurnosUpdate,
    ConfiguracionTurnosResponse,
    DisponibilidadResponse,
    LinkTurnoResponse,
    LinkTurnoPublicResponse,
    GenerarLinkRequest,
    ConfirmarTurnoRequest,
    CancelarTurnoRequest,
)
from app.repositories import turnos as turnos_repo
from app.repositories import link_turnos as link_turnos_repo
from app.services.turnos_service import TurnosService
from app.services.recordatorios_service import RecordatoriosService
from loguru import logger

router = APIRouter(prefix="/turnos", tags=["turnos"])


# ==================== Rutas de gestión (profesional) ====================

@router.get("", response_model=List[TurnoResponse])
def list_turnos(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    estado: Optional[str] = Query(None),
    paciente_id: Optional[int] = Query(None),
):
    """Lista los turnos del profesional con filtros opcionales"""
    tenant = TenantContext(current_user)
    
    turnos = turnos_repo.list_turnos(
        db=db,
        usuario_id=tenant.user_id,
        limit=limit,
        offset=offset,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado,
        paciente_id=paciente_id,
    )
    
    total = turnos_repo.count_turnos(
        db=db,
        usuario_id=tenant.user_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado,
        paciente_id=paciente_id,
    )
    
    response.headers["X-Total-Count"] = str(total)
    return turnos


@router.post("/", response_model=TurnoResponse)
def create_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Crea un nuevo turno desde el panel del profesional"""
    tenant = TenantContext(current_user)
    
    # Verificar disponibilidad
    disponible = turnos_repo.check_disponibilidad(
        db=db,
        usuario_id=tenant.user_id,
        fecha=turno.fecha,
        hora_inicio=turno.hora_inicio,
        duracion_minutos=turno.duracion_minutos,
    )
    
    if not disponible:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un turno en ese horario"
        )
    
    # Si se proporciona DNI, buscar o crear paciente automáticamente
    if turno.dni_paciente and not turno.paciente_id:
        paciente = TurnosService.buscar_o_crear_paciente(
            db=db,
            usuario_id=tenant.user_id,
            dni=turno.dni_paciente,
            nombre=turno.nombre_paciente or "",
            apellido=turno.apellido_paciente or "",
            telefono=turno.telefono_paciente,
            email=turno.email_paciente
        )
        turno.paciente_id = paciente.id
    
    turno_creado = turnos_repo.create_turno(db, turno, tenant.user_id)
    
    # Enviar confirmación automática cuando el profesional agenda el turno
    try:
        logger.info(f"📱 Intentando enviar confirmación para turno {turno_creado.id}")
        result = RecordatoriosService.enviar_confirmacion_turno(
            db=db,
            turno=turno_creado,
            metodo="whatsapp"  # Usar WhatsApp
        )
        logger.info(f"✅ Resultado envío confirmación: {result}")
    except Exception as e:
        # No fallar si el envío de confirmación tiene problemas
        # El turno se creó exitosamente de todos modos
        logger.error(f"❌ Error al enviar confirmación automática: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
    
    return turno_creado


@router.get("/{turno_id}", response_model=TurnoResponse)
def get_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Obtiene un turno específico"""
    tenant = TenantContext(current_user)
    turno = turnos_repo.get_turno(db, turno_id, tenant.user_id)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.patch("/{turno_id}", response_model=TurnoResponse)
def update_turno(
    turno_id: int,
    turno: TurnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Actualiza un turno"""
    tenant = TenantContext(current_user)
    
    # Si se actualiza fecha/hora, verificar disponibilidad
    if turno.fecha or turno.hora_inicio or turno.duracion_minutos:
        turno_actual = turnos_repo.get_turno(db, turno_id, tenant.user_id)
        if not turno_actual:
            raise HTTPException(status_code=404, detail="Turno no encontrado")
        
        fecha = turno.fecha or turno_actual.fecha
        hora_inicio = turno.hora_inicio or turno_actual.hora_inicio
        duracion = turno.duracion_minutos or turno_actual.duracion_minutos
        
        disponible = turnos_repo.check_disponibilidad(
            db=db,
            usuario_id=tenant.user_id,
            fecha=fecha,
            hora_inicio=hora_inicio,
            duracion_minutos=duracion,
            excluir_turno_id=turno_id,
        )
        
        if not disponible:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un turno en ese horario"
            )
    
    updated = turnos_repo.update_turno(db, turno_id, turno, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return updated


@router.delete("/{turno_id}", status_code=204)
def delete_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Elimina un turno"""
    tenant = TenantContext(current_user)
    if not turnos_repo.delete_turno(db, turno_id, tenant.user_id):
        raise HTTPException(status_code=404, detail="Turno no encontrado")


@router.post("/{turno_id}/cancelar", response_model=TurnoResponse)
def cancelar_turno(
    turno_id: int,
    request: CancelarTurnoRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Cancela un turno"""
    tenant = TenantContext(current_user)
    turno = turnos_repo.cancelar_turno(db, turno_id, tenant.user_id, request.motivo)
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    # Enviar notificación automática de cancelación
    try:
        logger.info(f"📱 Intentando enviar notificación de cancelación para turno {turno.id}")
        result = RecordatoriosService.enviar_cancelacion_turno(
            db=db,
            turno=turno,
            motivo=request.motivo,
            metodo="whatsapp"  # Usar WhatsApp
        )
        logger.info(f"✅ Resultado envío cancelación: {result}")
    except Exception as e:
        # No fallar si el envío de notificación tiene problemas
        # El turno se canceló exitosamente de todos modos
        logger.error(f"❌ Error al enviar notificación de cancelación: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
    
    return turno


# ==================== Configuración ====================

@router.get("/config/mi-configuracion", response_model=ConfiguracionTurnosResponse)
def get_configuracion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Obtiene la configuración de turnos del profesional"""
    tenant = TenantContext(current_user)
    config = turnos_repo.get_or_create_configuracion_turnos(db, tenant.user_id)
    return config


@router.post("/config/mi-configuracion", response_model=ConfiguracionTurnosResponse)
def create_configuracion(
    config: ConfiguracionTurnosCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Crea la configuración de turnos del profesional"""
    tenant = TenantContext(current_user)
    
    # Verificar si ya existe
    existing = turnos_repo.get_configuracion_turnos(db, tenant.user_id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una configuración. Use PATCH para actualizar."
        )
    
    return turnos_repo.create_configuracion_turnos(db, config, tenant.user_id)


@router.patch("/config/mi-configuracion", response_model=ConfiguracionTurnosResponse)
def update_configuracion(
    config: ConfiguracionTurnosUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Actualiza la configuración de turnos del profesional"""
    tenant = TenantContext(current_user)
    updated = turnos_repo.update_configuracion_turnos(db, config, tenant.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return updated


# ==================== Disponibilidad ====================

@router.get("/disponibilidad/slots", response_model=DisponibilidadResponse)
def get_slots_disponibles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    duracion_minutos: int = Query(...),
):
    """Obtiene los slots disponibles para un rango de fechas"""
    tenant = TenantContext(current_user)
    return TurnosService.obtener_slots_disponibles(
        db=db,
        usuario_id=tenant.user_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        duracion_minutos=duracion_minutos,
    )


@router.post("/links/generar", response_model=LinkTurnoResponse)
def generar_link(
    request_data: GenerarLinkRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Genera un link compartible para reservar turnos"""
    tenant = TenantContext(current_user)
    
    # Obtener base URL del request
    # En desarrollo local, apuntar al frontend (Vite)
    # En producción, usar el mismo dominio
    backend_url = str(request.base_url).rstrip('/')
    
    # Detectar si estamos en desarrollo local
    if 'localhost:8000' in backend_url or '127.0.0.1:8000' in backend_url:
        # Apuntar al frontend de Vite
        frontend_url = 'http://localhost:3000'
    else:
        # En producción, el frontend y backend están en el mismo dominio
        # La URL del frontend es la misma sin el /v1
        frontend_url = backend_url.replace('/v1', '').replace(':8000', '')
    
    return TurnosService.generar_link_reserva(
        db=db,
        usuario_id=tenant.user_id,
        duracion_minutos=request_data.duracion_minutos,
        base_url=frontend_url,
    )


@router.get("/estadisticas/{mes}/{anio}")
def get_estadisticas(
    mes: int,
    anio: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """Obtiene estadísticas de turnos para un mes"""
    tenant = TenantContext(current_user)
    return TurnosService.get_estadisticas_turnos(
        db=db,
        usuario_id=tenant.user_id,
        mes=mes,
        anio=anio,
    )


# ==================== Rutas públicas (reserva de turnos) ====================

@router.get("/publico/{usuario_id}/disponibilidad", response_model=DisponibilidadResponse)
def get_disponibilidad_publica(
    usuario_id: int,
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    duracion_minutos: int = Query(...),
    db: Session = Depends(get_db),
):
    """Obtiene slots disponibles (ruta pública para pacientes)"""
    return TurnosService.obtener_slots_disponibles(
        db=db,
        usuario_id=usuario_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        duracion_minutos=duracion_minutos,
    )


@router.post("/publico/{usuario_id}/reservar", response_model=TurnoResponsePublic)
def reservar_turno_publico(
    usuario_id: int,
    turno: TurnoCreatePublic,
    db: Session = Depends(get_db),
):
    """Reserva un turno desde el formulario público"""
    # Validar que el turno se puede reservar
    TurnosService.validar_turno_publico(
        db=db,
        usuario_id=usuario_id,
        fecha=turno.fecha,
        hora_inicio=turno.hora_inicio,
        duracion_minutos=turno.duracion_minutos,
    )
    
    # Generar token único
    token = TurnosService.generar_token_reserva()
    
    # Crear el turno
    turno_creado = turnos_repo.create_turno_publico(
        db=db,
        dto=turno,
        usuario_id=usuario_id,
        token=token,
    )
    
    # No se envía confirmación automática
    # Solo se enviará recordatorio 24hs antes vía cron job
    
    return turno_creado


@router.get("/publico/reserva/{token}", response_model=TurnoResponsePublic)
def get_turno_publico(
    token: str,
    db: Session = Depends(get_db),
):
    """Obtiene información de una reserva por su token (para confirmación)"""
    turno = turnos_repo.get_turno_by_token(db, token)
    if not turno:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return turno


@router.post("/publico/reserva/{token}/confirmar", response_model=TurnoResponsePublic)
def confirmar_turno_publico(
    token: str,
    request: ConfirmarTurnoRequest,
    db: Session = Depends(get_db),
):
    """Confirma una reserva de turno por parte del paciente"""
    turno = turnos_repo.confirmar_turno_paciente(db, token)
    if not turno:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return turno


@router.post("/publico/reserva/{token}/cancelar", response_model=TurnoResponsePublic)
def cancelar_turno_publico(
    token: str,
    request: CancelarTurnoRequest,
    db: Session = Depends(get_db),
):
    """Cancela una reserva de turno desde el link público"""
    turno = turnos_repo.get_turno_by_token(db, token)
    if not turno:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    turno.estado = 'cancelado'
    if request.motivo:
        if turno.observaciones:
            turno.observaciones += f"\n\nMotivo cancelación (paciente): {request.motivo}"
        else:
            turno.observaciones = f"Motivo cancelación (paciente): {request.motivo}"
    
    db.commit()
    db.refresh(turno)
    return turno


# ==================== Rutas públicas con token (nuevo sistema) ====================

@router.get("/publico/link/{token}/info", response_model=LinkTurnoPublicResponse)
def get_link_info(
    token: str,
    db: Session = Depends(get_db),
):
    """Obtiene información del link de reserva (sin autenticación)"""
    link = link_turnos_repo.get_link_by_token(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Link no encontrado")
    
    if not link.activo:
        raise HTTPException(status_code=400, detail="Este link ha sido desactivado")
    
    # Verificar expiración si está configurada
    from datetime import datetime
    if link.fecha_expiracion and datetime.now() > link.fecha_expiracion:
        raise HTTPException(status_code=400, detail="Este link ha expirado")
    
    # Construir nombre profesional
    nombre_completo = f"{link.usuario.nombre} {link.usuario.apellido}".strip() if hasattr(link.usuario, 'nombre') and hasattr(link.usuario, 'apellido') else "Profesional"
    especialidad = link.usuario.especialidad if hasattr(link.usuario, 'especialidad') else "Profesional de la salud"
    
    # Retornar información pública del link
    return LinkTurnoPublicResponse(
        duracion_minutos=link.duracion_minutos,
        mensaje_personalizado=link.mensaje_personalizado,
        activo=link.activo,
        nombre_profesional=nombre_completo,
        especialidad=especialidad,
    )


@router.get("/publico/link/{token}/disponibilidad", response_model=DisponibilidadResponse)
def get_disponibilidad_por_token(
    token: str,
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Obtiene slots disponibles usando el token del link (sin autenticación)"""
    # Buscar el link por token
    link = link_turnos_repo.get_link_by_token(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Link no encontrado")
    
    if not link.activo:
        raise HTTPException(status_code=400, detail="Este link ha sido desactivado")
    
    # Verificar expiración
    from datetime import datetime
    if link.fecha_expiracion and datetime.now() > link.fecha_expiracion:
        raise HTTPException(status_code=400, detail="Este link ha expirado")
    
    # Obtener slots disponibles con la duración pre-configurada del link
    return TurnosService.obtener_slots_disponibles(
        db=db,
        usuario_id=link.usuario_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        duracion_minutos=link.duracion_minutos,
    )


@router.post("/publico/link/{token}/reservar", response_model=TurnoResponsePublic)
def reservar_turno_con_token(
    token: str,
    turno: TurnoCreatePublic,
    db: Session = Depends(get_db),
):
    """Reserva un turno usando el token del link (sin autenticación)"""
    # Buscar el link por token
    link = link_turnos_repo.get_link_by_token(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Link no encontrado")
    
    if not link.activo:
        raise HTTPException(status_code=400, detail="Este link ha sido desactivado")
    
    # Verificar expiración
    from datetime import datetime
    if link.fecha_expiracion and datetime.now() > link.fecha_expiracion:
        raise HTTPException(status_code=400, detail="Este link ha expirado")
    
    # Forzar la duración del link (no permitir que el cliente la cambie)
    turno.duracion_minutos = link.duracion_minutos
    
    # Validar que el turno se puede reservar
    TurnosService.validar_turno_publico(
        db=db,
        usuario_id=link.usuario_id,
        fecha=turno.fecha,
        hora_inicio=turno.hora_inicio,
        duracion_minutos=link.duracion_minutos,
    )
    
    # Generar token único para la reserva
    reserva_token = TurnosService.generar_token_reserva()
    
    # Crear el turno
    turno_creado = turnos_repo.create_turno_publico(
        db=db,
        dto=turno,
        usuario_id=link.usuario_id,
        token=reserva_token,
    )
    
    # Incrementar contador de usos del link
    link_turnos_repo.increment_usage(db, link.id)
    
    # No se envía confirmación automática
    # Solo se enviará recordatorio 24hs antes vía cron job
    
    return turno_creado
