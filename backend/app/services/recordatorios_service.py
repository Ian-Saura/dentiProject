"""
Recordatorios Service
Manages appointment reminders via WhatsApp, SMS, and Email
"""
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from loguru import logger

from app.models.turnos import Turno, EstadoTurno
from app.models.pacientes import Paciente
from app.services.twilio_service import twilio_service


class RecordatoriosService:
    """Service for managing appointment reminders"""
    
    @staticmethod
    def get_turnos_para_recordar(
        db: Session,
        usuario_id: int,
        dias_anticipacion: int = 1
    ) -> List[Turno]:
        """
        Get appointments that need reminders
        
        Args:
            db: Database session
            usuario_id: Doctor's user ID
            dias_anticipacion: Days in advance to send reminder (default: 1 day)
        
        Returns:
            List of appointments that need reminders
        """
        from datetime import datetime
        
        # Calculate target date
        target_date = date.today() + timedelta(days=dias_anticipacion)
        
        # Query turnos that:
        # 1. Are for the specified doctor
        # 2. Are on the target date
        # 3. Are reservado or confirmado
        # 4. Haven't had reminder sent yet
        # 5. Fueron creados hace más de 1 hora (para evitar recordatorios inmediatos)
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        turnos = db.query(Turno).filter(
            and_(
                Turno.usuario_id == usuario_id,
                Turno.fecha == target_date,
                Turno.estado.in_([EstadoTurno.reservado, EstadoTurno.confirmado]),
                Turno.recordatorio_enviado == False,
                Turno.fecha_creacion < one_hour_ago  # Creado hace más de 1 hora
            )
        ).all()
        
        return turnos
    
    @staticmethod
    def enviar_recordatorio_turno(
        db: Session,
        turno: Turno,
        metodo: str = "whatsapp",
        doctor_name: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict:
        """
        Send reminder for a single appointment
        
        Args:
            db: Database session
            turno: Turno object
            metodo: "whatsapp", "sms", or "auto" (auto tries WhatsApp first, then SMS)
            doctor_name: Doctor's name (optional, will use usuario.nombre if not provided)
            location: Clinic location (optional)
        
        Returns:
            Dict with success status and details
        """
        # Verificar que el turno esté en el futuro (al menos 2 horas)
        from datetime import datetime
        now = datetime.now()
        turno_datetime = datetime.combine(turno.fecha, turno.hora_inicio)
        
        horas_hasta_turno = (turno_datetime - now).total_seconds() / 3600
        
        if horas_hasta_turno < 2:
            logger.info(f"Turno {turno.id}: Muy próximo o ya pasó, no se envía recordatorio")
            return {
                "success": True,
                "skipped": True,
                "message": "Turno muy próximo o ya pasó"
            }
        
        # Get patient phone
        telefono = None
        nombre_paciente = ""
        
        if turno.paciente_id and turno.paciente:
            # Patient is registered
            telefono = turno.paciente.telefono
            nombre_paciente = turno.paciente.nombre
        else:
            # Public booking (no registered patient)
            telefono = turno.telefono_paciente
            nombre_paciente = turno.nombre_paciente or "paciente"
        
        # Si no hay teléfono, no enviar mensaje (no es error, simplemente skip)
        if not telefono or telefono.strip() == "":
            logger.info(f"Turno {turno.id}: Sin teléfono, no se envía recordatorio")
            return {
                "success": True,
                "skipped": True,
                "message": "Sin teléfono registrado"
            }
        
        # Get doctor name
        if not doctor_name and turno.usuario:
            doctor_name = f"Dr/a. {turno.usuario.nombre}"
            if turno.usuario.apellido:
                doctor_name += f" {turno.usuario.apellido}"
        elif not doctor_name:
            doctor_name = "su profesional"
        
        # Combine date and time
        appointment_datetime = datetime.combine(
            turno.fecha,
            turno.hora_inicio
        )
        
        # Send reminder based on method
        result = None
        
        if metodo == "whatsapp":
            result = twilio_service.send_appointment_reminder_whatsapp(
                to_phone=telefono,
                patient_name=nombre_paciente,
                appointment_date=appointment_datetime,
                doctor_name=doctor_name,
                location=location
            )
        elif metodo == "sms":
            result = twilio_service.send_appointment_reminder_sms(
                to_phone=telefono,
                patient_name=nombre_paciente,
                appointment_date=appointment_datetime,
                doctor_name=doctor_name
            )
        elif metodo == "auto":
            # Try WhatsApp first
            result = twilio_service.send_appointment_reminder_whatsapp(
                to_phone=telefono,
                patient_name=nombre_paciente,
                appointment_date=appointment_datetime,
                doctor_name=doctor_name,
                location=location
            )
            
            # If WhatsApp fails, try SMS
            if not result.get("success"):
                logger.warning(f"WhatsApp failed for turno {turno.id}, trying SMS")
                result = twilio_service.send_appointment_reminder_sms(
                    to_phone=telefono,
                    patient_name=nombre_paciente,
                    appointment_date=appointment_datetime,
                    doctor_name=doctor_name
                )
        else:
            return {
                "success": False,
                "error": f"Método no válido: {metodo}"
            }
        
        # Mark as sent if successful
        if result.get("success"):
            turno.recordatorio_enviado = True
            db.commit()
            logger.info(f"Recordatorio enviado para turno {turno.id} ({metodo})")
        
        return result
    
    @staticmethod
    def enviar_recordatorios_automaticos(
        db: Session,
        usuario_id: int,
        dias_anticipacion: int = 1,
        metodo: str = "auto"
    ) -> Dict:
        """
        Send automatic reminders for all upcoming appointments
        
        Args:
            db: Database session
            usuario_id: Doctor's user ID
            dias_anticipacion: Days in advance
            metodo: "whatsapp", "sms", or "auto"
        
        Returns:
            Dict with summary of sent reminders
        """
        turnos = RecordatoriosService.get_turnos_para_recordar(
            db=db,
            usuario_id=usuario_id,
            dias_anticipacion=dias_anticipacion
        )
        
        if not turnos:
            return {
                "success": True,
                "total": 0,
                "enviados": 0,
                "fallidos": 0,
                "message": "No hay turnos para enviar recordatorios"
            }
        
        enviados = 0
        fallidos = 0
        errores = []
        
        for turno in turnos:
            result = RecordatoriosService.enviar_recordatorio_turno(
                db=db,
                turno=turno,
                metodo=metodo
            )
            
            if result.get("success"):
                enviados += 1
            else:
                fallidos += 1
                errores.append({
                    "turno_id": turno.id,
                    "paciente": turno.nombre_paciente or (turno.paciente.nombre if turno.paciente else ""),
                    "error": result.get("error", "Unknown error")
                })
        
        logger.info(f"Recordatorios automáticos: {enviados} enviados, {fallidos} fallidos")
        
        return {
            "success": True,
            "total": len(turnos),
            "enviados": enviados,
            "fallidos": fallidos,
            "errores": errores if errores else None
        }
    
    @staticmethod
    def enviar_confirmacion_turno(
        db: Session,
        turno: Turno,
        metodo: str = "whatsapp",
        use_template: bool = False  # Desactivar templates por ahora
    ) -> Dict:
        """
        Send confirmation after appointment booking
        
        Args:
            db: Database session
            turno: Turno object
            metodo: "whatsapp" or "sms"
        
        Returns:
            Dict with success status
        """
        # Get patient phone and name
        telefono = turno.telefono_paciente or (turno.paciente.telefono if turno.paciente else None)
        nombre_paciente = turno.nombre_paciente or (turno.paciente.nombre if turno.paciente else "paciente")
        
        # Si no hay teléfono, no enviar (no es error)
        if not telefono or telefono.strip() == "":
            logger.info(f"Turno {turno.id}: Sin teléfono, no se envía confirmación")
            return {
                "success": True,
                "skipped": True,
                "message": "Sin teléfono registrado"
            }
        
        # Get doctor name
        doctor_name = "su profesional"
        if turno.usuario:
            doctor_name = f"Dr/a. {turno.usuario.nombre}"
            if turno.usuario.apellido:
                doctor_name += f" {turno.usuario.apellido}"
        
        # Combine date and time
        appointment_datetime = datetime.combine(
            turno.fecha,
            turno.hora_inicio
        )
        
        # Send confirmation
        use_whatsapp = metodo == "whatsapp"
        result = twilio_service.send_appointment_confirmation(
            to_phone=telefono,
            patient_name=nombre_paciente,
            appointment_date=appointment_datetime,
            doctor_name=doctor_name,
            use_whatsapp=use_whatsapp
        )
        
        return result
    
    @staticmethod
    def enviar_cancelacion_turno(
        db: Session,
        turno: Turno,
        motivo: Optional[str] = None,
        metodo: str = "whatsapp",
        doctor_name: Optional[str] = None,
    ) -> Dict:
        """
        Send cancellation notification to patient
        
        Args:
            db: Database session
            turno: Turno object
            motivo: Optional cancellation reason
            metodo: "whatsapp", "sms", or "auto"
            doctor_name: Optional doctor name override
        
        Returns:
            Dict with success status
        """
        # Get patient phone and name
        telefono = turno.telefono_paciente or (turno.paciente.telefono if turno.paciente else None)
        nombre_paciente = turno.paciente_nombre or (turno.paciente.nombre if turno.paciente else "paciente")
        
        # Si no hay teléfono, no enviar (no es error)
        if not telefono or telefono.strip() == "":
            logger.info(f"Turno {turno.id}: Sin teléfono, no se envía notificación de cancelación")
            return {
                "success": True,
                "skipped": True,
                "message": "Sin teléfono registrado"
            }
        
        # Get doctor name
        if not doctor_name:
            doctor_name = "su profesional"
            if turno.usuario:
                doctor_name = f"Dr/a. {turno.usuario.nombre}"
                if turno.usuario.apellido:
                    doctor_name += f" {turno.usuario.apellido}"
        
        # Combine date and time
        appointment_datetime = datetime.combine(
            turno.fecha,
            turno.hora_inicio
        )
        
        # Send cancellation notification
        use_whatsapp = metodo in ["whatsapp", "auto"]
        result = twilio_service.send_appointment_cancellation(
            to_phone=telefono,
            patient_name=nombre_paciente,
            appointment_date=appointment_datetime,
            doctor_name=doctor_name,
            motivo=motivo,
            use_whatsapp=use_whatsapp
        )
        
        if result.get("success"):
            logger.info(f"Notificación de cancelación enviada para turno {turno.id}")
        else:
            logger.warning(f"Error enviando notificación de cancelación para turno {turno.id}: {result.get('error')}")
        
        return result


recordatorios_service = RecordatoriosService()

