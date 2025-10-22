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
        # Use the tipo_cambio from config (dólar oficial venta) - convert to float
        tipo_cambio = float(config.tipo_cambio_usd_ars) if config and config.tipo_cambio_usd_ars else 1335.0

        # 1. Costos de equipos (amortización con inflación 4% anual) - always in USD
        equipos = db.query(CostoEquipo).filter(
            CostoEquipo.usuario_id == usuario_id,
            CostoEquipo.activo == True
        ).all()

        costo_equipos_anual_usd = 0.0
        fecha_actual = datetime.now()
        
        for equipo in equipos:
            if equipo.activo and equipo.monto_compra_usd and equipo.anios_vida_util and equipo.anios_vida_util > 0:
                monto_usd = float(equipo.monto_compra_usd)
                
                # Calcular vida útil restante basado en fecha de compra
                if equipo.fecha_compra:
                    # Calcular meses y años transcurridos
                    meses_transcurridos = (fecha_actual.year - equipo.fecha_compra.year) * 12 + \
                                         (fecha_actual.month - equipo.fecha_compra.month)
                    anios_transcurridos = meses_transcurridos / 12
                    
                    # Vida útil restante
                    vida_util_restante = equipo.anios_vida_util - anios_transcurridos
                    
                    # Solo si aún tiene vida útil
                    if vida_util_restante > 0:
                        # Costo de reposición con inflación sobre vida restante
                        costo_reposicion = monto_usd * (1.04 ** vida_util_restante)
                        amortizacion_anual = costo_reposicion / vida_util_restante
                        costo_equipos_anual_usd += amortizacion_anual
                else:
                    # Si no hay fecha de compra, usar cálculo original (toda la vida útil)
                    costo_reposicion = monto_usd * (1.04 ** equipo.anios_vida_util)
                    amortizacion_anual = costo_reposicion / equipo.anios_vida_util
                    costo_equipos_anual_usd += amortizacion_anual

        # Convertir equipos USD a ARS usando dólar oficial venta
        costo_equipos_anual_ars = costo_equipos_anual_usd * tipo_cambio

        # 2. Gastos fijos anuales - convertir según moneda
        gastos = db.query(GastoFijo).filter(
            GastoFijo.usuario_id == usuario_id,
            GastoFijo.activo == True
        ).all()

        costo_gastos_anual_ars = 0.0
        for g in gastos:
            if g.activo:
                monto_mensual = float(g.monto_mensual)
                # Convertir según moneda usando dólar oficial venta
                if g.moneda == 'USD':
                    monto_ars = monto_mensual * tipo_cambio
                else:  # ARS
                    monto_ars = monto_mensual
                costo_gastos_anual_ars += monto_ars * 12

        # 3. Cálculo final - TODO EN ARS
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

    @staticmethod
    def calcular_punto_equilibrio(db: Session, usuario_id: int) -> Dict[str, Any]:
        """
        Calcula el Punto de Equilibrio (Break-Even Point)
        
        Punto de Equilibrio = Costos Fijos Totales / (Precio Promedio por Consulta - Costo Variable Promedio)
        
        Returns:
            - consultas_necesarias_mes: Número de consultas mensuales para alcanzar equilibrio
            - consultas_necesarias_anual: Número de consultas anuales para alcanzar equilibrio
            - ingreso_necesario_mes: Ingreso mensual necesario para equilibrio
            - ingreso_necesario_anual: Ingreso anual necesario para equilibrio
            - precio_promedio: Precio promedio por consulta
            - margen_contribucion: Margen de contribución por consulta
            - costos_fijos_mensuales: Total de costos fijos mensuales
        """
        from app.models import Consulta
        
        # 1. Obtener costos fijos anuales
        costo_analysis = AnalyticsService.calcular_costo_hora_real(db, usuario_id)
        costos_fijos_anuales = costo_analysis['costo_total_anual']
        costos_fijos_mensuales = costos_fijos_anuales / 12
        
        # 2. Calcular precio promedio por consulta y costo variable
        consultas = db.query(Consulta).filter(
            Consulta.usuario_id == usuario_id
        ).all()
        
        if not consultas or len(consultas) == 0:
            # Si no hay consultas, usar valores estimados
            precio_promedio = 50000  # Precio promedio estimado
            costo_variable = 5000    # 10% del precio como costo variable estimado
        else:
            # Calcular precio promedio real
            precio_promedio = sum(float(c.monto_ars) for c in consultas) / len(consultas)
            
            # Costo variable estimado: 10-15% del precio (materiales, insumos por consulta)
            # En odontología, típicamente los costos variables son bajos
            costo_variable = precio_promedio * 0.10
        
        # 3. Calcular margen de contribución
        margen_contribucion = precio_promedio - costo_variable
        
        # 4. Calcular punto de equilibrio
        if margen_contribucion <= 0:
            # Si no hay margen positivo, no es posible alcanzar equilibrio
            return {
                'consultas_necesarias_mes': None,
                'consultas_necesarias_anual': None,
                'ingreso_necesario_mes': None,
                'ingreso_necesario_anual': None,
                'precio_promedio': round(precio_promedio, 0),
                'costo_variable_promedio': round(costo_variable, 0),
                'margen_contribucion': round(margen_contribucion, 0),
                'costos_fijos_mensuales': round(costos_fijos_mensuales, 0),
                'costos_fijos_anuales': round(costos_fijos_anuales, 0),
                'error': 'Margen de contribución negativo. Revisar precios y costos.'
            }
        
        # Punto de Equilibrio mensual y anual
        consultas_equilibrio_mes = costos_fijos_mensuales / margen_contribucion
        consultas_equilibrio_anual = costos_fijos_anuales / margen_contribucion
        
        # Ingreso necesario
        ingreso_necesario_mes = consultas_equilibrio_mes * precio_promedio
        ingreso_necesario_anual = consultas_equilibrio_anual * precio_promedio
        
        # 5. Calcular consultas actuales para comparar
        from datetime import datetime, timedelta
        hoy = datetime.now().date()
        mes_pasado = hoy - timedelta(days=30)
        
        consultas_ultimo_mes = db.query(Consulta).filter(
            Consulta.usuario_id == usuario_id,
            Consulta.fecha_consulta >= mes_pasado
        ).count()
        
        # Calcular si está por encima o debajo del punto de equilibrio
        diferencia_consultas = consultas_ultimo_mes - consultas_equilibrio_mes
        porcentaje_equilibrio = (consultas_ultimo_mes / consultas_equilibrio_mes * 100) if consultas_equilibrio_mes > 0 else 0
        
        return {
            'consultas_necesarias_mes': round(consultas_equilibrio_mes, 1),
            'consultas_necesarias_anual': round(consultas_equilibrio_anual, 0),
            'ingreso_necesario_mes': round(ingreso_necesario_mes, 0),
            'ingreso_necesario_anual': round(ingreso_necesario_anual, 0),
            'precio_promedio': round(precio_promedio, 0),
            'costo_variable_promedio': round(costo_variable, 0),
            'margen_contribucion': round(margen_contribucion, 0),
            'costos_fijos_mensuales': round(costos_fijos_mensuales, 0),
            'costos_fijos_anuales': round(costos_fijos_anuales, 0),
            'consultas_ultimo_mes': consultas_ultimo_mes,
            'diferencia_consultas': round(diferencia_consultas, 1),
            'porcentaje_equilibrio': round(porcentaje_equilibrio, 1),
            'esta_en_equilibrio': consultas_ultimo_mes >= consultas_equilibrio_mes
        }
