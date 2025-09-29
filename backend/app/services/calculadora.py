from __future__ import annotations

from typing import Dict, List, Any

from sqlalchemy.orm import Session

from app.services.analytics import AnalyticsService


class CalculadoraService:
    @staticmethod
    def recomendaciones(
        db: Session, usuario_id: int, tiempo_horas: float, costo_materiales_ars: float, usar_costo_real: bool = False
    ) -> List[Dict[str, Any]]:
        # Get cost analysis
        costo_analysis = AnalyticsService.calcular_costo_hora_real(db, usuario_id)
        costo_hora = costo_analysis['costo_hora_ars'] if usar_costo_real else 29000  # Default

        costo_total = (tiempo_horas * costo_hora) + costo_materiales_ars

        margenes = {
            "Supervivencia (25%)": 0.25,
            "Competitivo (50%)": 0.50,
            "Premium (75%)": 0.75,
            "Especialista (100%)": 1.00,
        }

        recomendaciones = []
        for nombre_margen, porcentaje_margen in margenes.items():
            precio_final = costo_total * (1 + porcentaje_margen)
            ganancia = precio_final - costo_total

            recomendaciones.append({
                "margen": nombre_margen,
                "precio": round(precio_final, 0),
                "ganancia": round(ganancia, 0),
                "valor": precio_final
            })

        return recomendaciones
