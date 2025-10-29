"""
Recordatorios Routes
API endpoints for appointment reminders
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.deps.auth import get_current_user
from app.models.usuarios import Usuario
from app.models.turnos import Turno
from app.services.recordatorios_service import recordatorios_service
from app.deps.roles import require_roles

router = APIRouter(prefix="/recordatorios", tags=["recordatorios"])


class EnviarRecordatorioRequest(BaseModel):
    turno_id: int
    metodo: str = "auto"  # "whatsapp", "sms", or "auto"
    doctor_name: str | None = None
    location: str | None = None


class RecordatoriosAutomaticosRequest(BaseModel):
    dias_anticipacion: int = 1
    metodo: str = "auto"


class EnviarConfirmacionRequest(BaseModel):
    turno_id: int
    metodo: str = "whatsapp"


@router.post("/enviar-recordatorio")
def enviar_recordatorio(
    request: EnviarRecordatorioRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles())
):
    """
    Send reminder for a specific appointment
    """
    # Get turno
    turno = db.query(Turno).filter(
        Turno.id == request.turno_id,
        Turno.usuario_id == current_user.id
    ).first()
    
    if not turno:
        raise HTTPException(
            status_code=404,
            detail="Turno no encontrado"
        )
    
    # Validate method
    if request.metodo not in ["whatsapp", "sms", "auto"]:
        raise HTTPException(
            status_code=400,
            detail="Método inválido. Use 'whatsapp', 'sms' o 'auto'"
        )
    
    # Send reminder
    result = recordatorios_service.enviar_recordatorio_turno(
        db=db,
        turno=turno,
        metodo=request.metodo,
        doctor_name=request.doctor_name,
        location=request.location
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Error al enviar recordatorio")
        )
    
    return {
        "success": True,
        "message": "Recordatorio enviado correctamente",
        "details": result
    }


@router.post("/enviar-automaticos")
def enviar_recordatorios_automaticos(
    request: RecordatoriosAutomaticosRequest = RecordatoriosAutomaticosRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles())
):
    """
    Send automatic reminders for all upcoming appointments
    """
    # Validate days in advance
    if request.dias_anticipacion < 0 or request.dias_anticipacion > 7:
        raise HTTPException(
            status_code=400,
            detail="Días de anticipación debe estar entre 0 y 7"
        )
    
    # Validate method
    if request.metodo not in ["whatsapp", "sms", "auto"]:
        raise HTTPException(
            status_code=400,
            detail="Método inválido. Use 'whatsapp', 'sms' o 'auto'"
        )
    
    # Send reminders
    result = recordatorios_service.enviar_recordatorios_automaticos(
        db=db,
        usuario_id=current_user.id,
        dias_anticipacion=request.dias_anticipacion,
        metodo=request.metodo
    )
    
    return result


@router.post("/enviar-confirmacion")
def enviar_confirmacion(
    request: EnviarConfirmacionRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles())
):
    """
    Send confirmation message after booking
    """
    # Get turno
    turno = db.query(Turno).filter(
        Turno.id == request.turno_id,
        Turno.usuario_id == current_user.id
    ).first()
    
    if not turno:
        raise HTTPException(
            status_code=404,
            detail="Turno no encontrado"
        )
    
    # Send confirmation
    result = recordatorios_service.enviar_confirmacion_turno(
        db=db,
        turno=turno,
        metodo=request.metodo
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Error al enviar confirmación")
        )
    
    return {
        "success": True,
        "message": "Confirmación enviada correctamente",
        "details": result
    }


@router.get("/pendientes")
def get_turnos_pendientes_recordatorio(
    dias_anticipacion: int = Query(1, ge=0, le=7),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles())
):
    """
    Get appointments that need reminders
    """
    turnos = recordatorios_service.get_turnos_para_recordar(
        db=db,
        usuario_id=current_user.id,
        dias_anticipacion=dias_anticipacion
    )
    
    # Format response
    turnos_data = []
    for turno in turnos:
        turno_info = {
            "id": turno.id,
            "fecha": turno.fecha.isoformat(),
            "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
            "hora_fin": turno.hora_fin.strftime("%H:%M"),
            "estado": turno.estado.value,
            "recordatorio_enviado": turno.recordatorio_enviado
        }
        
        # Add patient info
        if turno.paciente:
            turno_info["paciente"] = {
                "id": turno.paciente.id,
                "nombre": turno.paciente.nombre,
                "apellido": turno.paciente.apellido,
                "telefono": turno.paciente.telefono
            }
        else:
            turno_info["paciente"] = {
                "nombre": turno.nombre_paciente,
                "apellido": turno.apellido_paciente,
                "telefono": turno.telefono_paciente
            }
        
        turnos_data.append(turno_info)
    
    return {
        "total": len(turnos_data),
        "dias_anticipacion": dias_anticipacion,
        "turnos": turnos_data
    }

