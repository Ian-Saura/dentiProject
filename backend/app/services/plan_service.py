from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.models import Usuario
from app.models.usuarios import Plan


class PlanService:
    """Servicio para gestión de planes y subscripciones"""
    
    @staticmethod
    def assign_plan(
        db: Session,
        user: Usuario,
        plan: str,
        dias_duracion: Optional[int] = None
    ) -> Usuario:
        """
        Asignar un plan a un usuario
        
        Args:
            db: Sesión de base de datos
            user: Usuario al que asignar el plan
            plan: Tipo de plan (trial, premium, enterprise)
            dias_duracion: Días de duración del plan (opcional). Si no se especifica:
                          - trial: 14 días por defecto
                          - premium/enterprise: sin vencimiento
        
        Returns:
            Usuario actualizado
        """
        # Convert string to Plan enum
        user.plan = Plan(plan)
        user.fecha_inicio_plan = date.today()
        
        # Determinar fecha de vencimiento
        if dias_duracion is not None:
            # Si se especifica duración, aplicarla a cualquier plan
            user.fecha_vencimiento = date.today() + timedelta(days=dias_duracion)
        elif plan == "trial":
            # Trial expira después de 14 días por defecto
            user.fecha_vencimiento = date.today() + timedelta(days=14)
        else:
            # Premium y Enterprise sin vencimiento por defecto
            user.fecha_vencimiento = None
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_plan_status(user: Usuario) -> Dict:
        """
        Obtener el estado del plan de un usuario
        
        Args:
            user: Usuario a verificar
        
        Returns:
            Dict con información del plan
        """
        today = date.today()
        
        # Si no tiene plan asignado, asignar trial
        if not user.plan:
            user.plan = "trial"
        
        # Calcular días restantes
        dias_restantes = None
        trial_expirado = False
        puede_usar_app = True
        mensaje = None
        
        if user.plan == "trial":
            if user.fecha_vencimiento:
                dias_restantes = (user.fecha_vencimiento - today).days
                
                if dias_restantes < 0:
                    trial_expirado = True
                    puede_usar_app = False
                    mensaje = (
                        f"Tu período de prueba ha expirado. "
                        f"Por favor contacta a nuestro equipo para actualizar a Premium y seguir usando la aplicación."
                    )
                elif dias_restantes <= 3:
                    mensaje = (
                        f"⚠️ Tu período de prueba expira en {dias_restantes} días. "
                        f"Contacta a nuestro equipo para actualizar a Premium."
                    )
            else:
                # Si no tiene fecha de vencimiento, asignarla
                dias_restantes = 7
        elif user.plan in ["premium", "enterprise"]:
            puede_usar_app = True
            mensaje = f"✨ Plan {user.plan.capitalize()} activo"
        
        return {
            "plan": user.plan,
            "fecha_inicio_plan": user.fecha_inicio_plan.isoformat() if user.fecha_inicio_plan else None,
            "fecha_vencimiento": user.fecha_vencimiento.isoformat() if user.fecha_vencimiento else None,
            "dias_restantes": dias_restantes,
            "trial_expirado": trial_expirado,
            "puede_usar_app": puede_usar_app,
            "mensaje": mensaje
        }
    
    @staticmethod
    def check_plan_access(user: Usuario) -> bool:
        """
        Verificar si el usuario tiene acceso activo a la aplicación
        
        Args:
            user: Usuario a verificar
        
        Returns:
            True si tiene acceso, False si no
        """
        status = PlanService.get_plan_status(user)
        return status["puede_usar_app"]




