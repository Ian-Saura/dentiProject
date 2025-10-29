"""
Twilio Service for WhatsApp and SMS notifications
"""
from typing import Optional, Dict
from datetime import datetime, timedelta
import os
import json
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from loguru import logger


class TwilioService:
    """Service for sending WhatsApp and SMS messages via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Twilio Sandbox default
        self.sms_from = os.getenv("TWILIO_SMS_FROM")
        
        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured. SMS/WhatsApp features will be disabled.")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
    
    def _format_phone_number(self, phone: str) -> str:
        """
        Format phone number to E.164 format (+54 for Argentina)
        Examples:
            1122334455 -> +5491122334455
            +5491122334455 -> +5491122334455
            011 2233-4455 -> +5491122334455
        """
        # Remove all non-numeric characters except +
        phone = ''.join(c for c in phone if c.isdigit() or c == '+')
        
        # If already has +54, return as is
        if phone.startswith('+54'):
            return phone
        
        # If starts with +, assume it's already formatted
        if phone.startswith('+'):
            return phone
        
        # Remove leading 0 or 15 (common in Argentina)
        if phone.startswith('0'):
            phone = phone[1:]
        
        # If it's a cell phone starting with 15, remove it (will add 9 later)
        if phone.startswith('15'):
            phone = phone[2:]
        
        # If starts with 11 (Buenos Aires area code), add 9 for cell phones
        if phone.startswith('11') and len(phone) == 10:
            phone = '9' + phone
        
        # Add country code
        return f'+54{phone}'
    
    def send_whatsapp(
        self, 
        to_phone: str, 
        message: str,
        media_url: Optional[str] = None
    ) -> Dict:
        """
        Send WhatsApp message
        
        Args:
            to_phone: Recipient phone number (will be formatted to E.164)
            message: Message content
            media_url: Optional media URL (image, PDF, etc.)
        
        Returns:
            Dict with status and message_sid or error
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            to_number = self._format_phone_number(to_phone)
            whatsapp_to = f"whatsapp:{to_number}"
            
            message_params = {
                "from_": self.whatsapp_from,
                "to": whatsapp_to,
                "body": message
            }
            
            if media_url:
                message_params["media_url"] = [media_url]
            
            sent_message = self.client.messages.create(**message_params)
            
            logger.info(f"WhatsApp sent to {to_number}: {sent_message.sid}")
            
            return {
                "success": True,
                "message_sid": sent_message.sid,
                "status": sent_message.status,
                "to": to_number
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio WhatsApp error: {e.msg}")
            return {
                "success": False,
                "error": e.msg,
                "error_code": e.code
            }
        except Exception as e:
            logger.error(f"WhatsApp send error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_sms(
        self,
        to_phone: str,
        message: str
    ) -> Dict:
        """
        Send SMS message
        
        Args:
            to_phone: Recipient phone number (will be formatted to E.164)
            message: Message content (max 160 chars recommended)
        
        Returns:
            Dict with status and message_sid or error
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio not configured"}
        
        if not self.sms_from:
            logger.error("SMS FROM number not configured")
            return {"success": False, "error": "SMS FROM number not configured"}
        
        try:
            to_number = self._format_phone_number(to_phone)
            
            sent_message = self.client.messages.create(
                from_=self.sms_from,
                to=to_number,
                body=message
            )
            
            logger.info(f"SMS sent to {to_number}: {sent_message.sid}")
            
            return {
                "success": True,
                "message_sid": sent_message.sid,
                "status": sent_message.status,
                "to": to_number
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio SMS error: {e.msg}")
            return {
                "success": False,
                "error": e.msg,
                "error_code": e.code
            }
        except Exception as e:
            logger.error(f"SMS send error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_appointment_reminder_whatsapp(
        self,
        to_phone: str,
        patient_name: str,
        appointment_date: datetime,
        doctor_name: str,
        location: Optional[str] = None
    ) -> Dict:
        """
        Send appointment reminder via WhatsApp using approved template
        Template ID: HXf066440744521f3ec44a4453154f2720
        
        Args:
            to_phone: Patient phone number
            patient_name: Patient's first name
            appointment_date: Appointment datetime
            doctor_name: Doctor's name
            location: Optional clinic location
        
        Returns:
            Dict with send status
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            to_number = self._format_phone_number(to_phone)
            whatsapp_to = f"whatsapp:{to_number}"
            
            # Format date and time for template
            fecha_str = appointment_date.strftime("%d/%m/%Y")
            hora_str = appointment_date.strftime("%H:%M")
            
            # Prepare content variables as proper JSON
            content_vars = {
                "1": patient_name,
                "2": fecha_str,
                "3": hora_str,
                "4": doctor_name
            }
            
            # Use Twilio Content Template (approved by WhatsApp)
            sent_message = self.client.messages.create(
                from_=self.whatsapp_from,
                to=whatsapp_to,
                content_sid="HXf066440744521f3ec44a4453154f2720",  # Recordatorio template
                content_variables=json.dumps(content_vars)
            )
            
            logger.info(f"WhatsApp reminder sent to {to_number}: {sent_message.sid}")
            
            return {
                "success": True,
                "message_sid": sent_message.sid,
                "status": sent_message.status,
                "to": to_number
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio WhatsApp reminder error: {e.msg}")
            return {
                "success": False,
                "error": e.msg,
                "error_code": e.code
            }
        except Exception as e:
            logger.error(f"WhatsApp reminder send error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_appointment_reminder_sms(
        self,
        to_phone: str,
        patient_name: str,
        appointment_date: datetime,
        doctor_name: str
    ) -> Dict:
        """
        Send appointment reminder via SMS (shorter version)
        
        Args:
            to_phone: Patient phone number
            patient_name: Patient's first name
            appointment_date: Appointment datetime
            doctor_name: Doctor's name
        
        Returns:
            Dict with send status
        """
        fecha_str = appointment_date.strftime("%d/%m %H:%M")
        
        message = f"Hola {patient_name}! Recordatorio: turno {fecha_str}hs con {doctor_name}. Te esperamos!"
        
        return self.send_sms(to_phone, message)
    
    def send_appointment_confirmation(
        self,
        to_phone: str,
        patient_name: str,
        appointment_date: datetime,
        doctor_name: str,
        use_whatsapp: bool = True,
        use_template: bool = False  # Desactivar templates por ahora
    ) -> Dict:
        """
        Send appointment confirmation (after booking) using approved template
        Template ID: HXf1872d043ad3a3dfb6d0b0829eee7884
        
        Args:
            to_phone: Patient phone number
            patient_name: Patient's first name
            appointment_date: Appointment datetime
            doctor_name: Doctor's name
            use_whatsapp: Use WhatsApp if True, SMS if False
        
        Returns:
            Dict with send status
        """
        fecha_str = appointment_date.strftime("%d/%m/%Y")
        hora_str = appointment_date.strftime("%H:%M")
        
        # Usar mensaje simple en lugar de template por ahora
        message = f"¡Hola {patient_name}! Tu turno ha sido agendado con {doctor_name} para el {fecha_str} a las {hora_str}. ¡Te esperamos!"
        
        if use_whatsapp:
            logger.info(f"Enviando confirmación WhatsApp a {to_phone}")
            return self.send_whatsapp(to_phone, message)
        else:
            message = f"Turno confirmado: {fecha_str} {hora_str}hs con {doctor_name}. Te esperamos!"
            return self.send_sms(to_phone, message)
    
    def send_appointment_cancellation(
        self,
        to_phone: str,
        patient_name: str,
        appointment_date: datetime,
        doctor_name: str,
        motivo: Optional[str] = None,
        use_whatsapp: bool = True
    ) -> Dict:
        """
        Send appointment cancellation notification
        
        Args:
            to_phone: Patient phone number
            patient_name: Patient's first name
            appointment_date: Original appointment datetime
            doctor_name: Doctor's name
            motivo: Optional cancellation reason
            use_whatsapp: Use WhatsApp if True, SMS if False
        
        Returns:
            Dict with send status
        """
        fecha_str = appointment_date.strftime("%d/%m/%Y")
        hora_str = appointment_date.strftime("%H:%M")
        
        # Build cancellation message
        message = f"Hola {patient_name}! Tu turno del {fecha_str} a las {hora_str}hs con {doctor_name} ha sido cancelado."
        
        if motivo:
            message += f" Motivo: {motivo}."
        
        message += " Por favor contactanos para reagendar."
        
        if use_whatsapp:
            return self.send_whatsapp(to_phone, message)
        else:
            # SMS version (shorter)
            sms_message = f"Turno cancelado: {fecha_str} {hora_str}hs con {doctor_name}."
            if motivo:
                sms_message += f" {motivo}."
            sms_message += " Contactanos para reagendar."
            return self.send_sms(to_phone, sms_message)


# Singleton instance
twilio_service = TwilioService()

