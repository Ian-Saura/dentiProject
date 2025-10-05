from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Consulta, CostoEquipo, GastoFijo
from app.repositories import get_config_by_usuario


class AnalyticsService:
    @staticmethod
    def get_resumen(db: Session, usuario_id: int) -> Dict[str, Any]:
        # Get all consultas for the user
        consultas = db.query(Consulta).filter(Consulta.usuario_id == usuario_id).all()

        if not consultas:
            return {
                'total_consultas': 0,
                'ingreso_total': 0,
                'promedio_consulta': 0,
                'tratamiento_popular': 'N/A',
                'ingresos_mes': 0
            }

        total_consultas = len(consultas)
        ingreso_total = sum(c.monto_ars for c in consultas)
        promedio_consulta = ingreso_total / total_consultas if total_consultas > 0 else 0

        # Tratamiento popular - match app.py logic
        tratamientos = {}
        for c in consultas:
            # Use prestacion name from relationship or fallback
            if hasattr(c, 'prestacion_usuario') and c.prestacion_usuario:
                if c.prestacion_usuario.nombre_personalizado:
                    nombre = c.prestacion_usuario.nombre_personalizado
                elif hasattr(c.prestacion_usuario, 'prestacion') and c.prestacion_usuario.prestacion:
                    nombre = c.prestacion_usuario.prestacion.nombre
                else:
                    nombre = 'Sin especificar'
            else:
                nombre = 'Sin especificar'
            tratamientos[nombre] = tratamientos.get(nombre, 0) + 1

        tratamiento_popular = max(tratamientos, key=tratamientos.get) if tratamientos else 'N/A'

        # Ingresos del mes actual
        fecha_actual = datetime.now()
        mes_actual = fecha_actual.month
        year_actual = fecha_actual.year

        ingresos_mes = sum(
            c.monto_ars for c in consultas
            if c.fecha_consulta.month == mes_actual and c.fecha_consulta.year == year_actual
        )

        return {
            'total_consultas': total_consultas,
            'ingreso_total': round(ingreso_total, 0),
            'promedio_consulta': round(promedio_consulta, 0),
            'tratamiento_popular': tratamiento_popular,
            'ingresos_mes': round(ingresos_mes, 0)
        }

    @staticmethod
    def get_kpis(db: Session, usuario_id: int) -> Dict[str, Any]:
        consultas = db.query(Consulta).filter(Consulta.usuario_id == usuario_id).all()

        if not consultas:
            return {
                'dias_desde_ultima_consulta': None,
                'consultas_ultima_semana': 0,
                'ingreso_promedio_diario': 0,
                'crecimiento_mensual': 0
            }

        # Días desde última consulta
        fechas = [c.fecha_consulta for c in consultas]
        ultima_consulta = max(fechas) if fechas else None
        dias_desde_ultima = (datetime.now().date() - ultima_consulta).days if ultima_consulta else None

        # Consultas última semana
        semana_atras = datetime.now().date() - timedelta(days=7)
        consultas_semana = [c for c in consultas if c.fecha_consulta >= semana_atras]

        # Ingreso promedio diario (últimos 30 días)
        mes_atras = datetime.now().date() - timedelta(days=30)
        consultas_mes = [c for c in consultas if c.fecha_consulta >= mes_atras]
        ingreso_mes = sum(c.monto_ars for c in consultas_mes)
        ingreso_promedio_diario = ingreso_mes / 30 if ingreso_mes > 0 else 0

        # Crecimiento mensual (comparar este mes vs mes anterior)
        mes_actual = datetime.now().month
        year_actual = datetime.now().year
        mes_anterior = mes_actual - 1 if mes_actual > 1 else 12
        year_anterior = year_actual if mes_actual > 1 else year_actual - 1

        consultas_mes_actual = sum(
            c.monto_ars for c in consultas
            if c.fecha_consulta.month == mes_actual and c.fecha_consulta.year == year_actual
        )
        consultas_mes_anterior = sum(
            c.monto_ars for c in consultas
            if c.fecha_consulta.month == mes_anterior and c.fecha_consulta.year == year_anterior
        )

        crecimiento = 0
        if consultas_mes_anterior > 0:
            crecimiento = ((consultas_mes_actual - consultas_mes_anterior) / consultas_mes_anterior) * 100

        return {
            'dias_desde_ultima_consulta': dias_desde_ultima,
            'consultas_ultima_semana': len(consultas_semana),
            'ingreso_promedio_diario': round(ingreso_promedio_diario, 2),
            'crecimiento_mensual': round(crecimiento, 2)
        }

    @staticmethod
    def calcular_costo_hora_real(db: Session, usuario_id: int) -> Dict[str, Any]:
        # Match exact app.py logic including persistence updates
        config = get_config_by_usuario(db, usuario_id)
        horas_anuales = config.horas_anuales_trabajadas if config else 1100
        tipo_cambio = 1335.0  # Default from app.py

        # 1. Costos de equipos (amortización con inflación 4% anual) - exact app.py logic
        equipos = db.query(CostoEquipo).filter(
            CostoEquipo.usuario_id == usuario_id,
            CostoEquipo.activo == True
        ).all()

        costo_equipos_anual_usd = 0
        for equipo in equipos:
            if equipo.activo and equipo.monto_compra_usd and equipo.anios_vida_util and equipo.anios_vida_util > 0:
                # Amortización con inflación - exact app.py calculation
                monto_usd = float(equipo.monto_compra_usd)
                costo_reposicion = monto_usd * (1.04 ** equipo.anios_vida_util)
                amortizacion_anual = costo_reposicion / equipo.anios_vida_util
                costo_equipos_anual_usd += amortizacion_anual

        # Convertir USD a ARS
        costo_equipos_anual_ars = costo_equipos_anual_usd * tipo_cambio

        # 2. Gastos fijos anuales (ARS) - exact app.py logic
        gastos = db.query(GastoFijo).filter(
            GastoFijo.usuario_id == usuario_id,
            GastoFijo.activo == True
        ).all()

        costo_gastos_anual_ars = sum(
            float(g.monto_mensual_ars) * 12 
            for g in gastos 
            if g.activo
        )

        # 3. Cálculo final - exact app.py logic
        costo_total_anual = costo_equipos_anual_ars + costo_gastos_anual_ars
        costo_hora = costo_total_anual / horas_anuales if horas_anuales > 0 else 0

        # 4. Update config with calculated cost (match app.py persistence behavior)
        if config:
            config.costo_hora_calculado_ars = costo_hora
            db.commit()

        return {
            'costo_hora_ars': costo_hora,
            'costo_equipos_anual': costo_equipos_anual_ars,
            'costo_gastos_anual': costo_gastos_anual_ars,
            'costo_total_anual': costo_total_anual,
            'horas_anuales': horas_anuales,
            'cantidad_equipos': len([e for e in equipos if e.activo]),
            'cantidad_gastos': len([g for g in gastos if g.activo])
        }
