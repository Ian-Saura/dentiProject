from __future__ import annotations

from app.services.analytics import AnalyticsService


class CostosService:
    @staticmethod
    def analisis_costos(db, usuario_id: int):
        return AnalyticsService.calcular_costo_hora_real(db, usuario_id)
