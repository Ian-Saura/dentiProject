from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Consulta
from app.schemas import ConsultaOut


class ConsultasUtilsService:
    @staticmethod
    def aplicar_filtros_visualizacion(
        db: Session, usuario_id: int, mostrar_desde: str, cantidad: str, ordenar_por: str
    ) -> List[ConsultaOut]:
        query = db.query(Consulta).filter(Consulta.usuario_id == usuario_id)

        # Filtrar por período - match exact app.py logic
        fecha_actual = datetime.now()
        if mostrar_desde == "Este mes":
            query = query.filter(
                Consulta.fecha_consulta.month == fecha_actual.month,
                Consulta.fecha_consulta.year == fecha_actual.year
            )
        elif mostrar_desde == "Último mes":
            # Match app.py logic exactly
            from dateutil.relativedelta import relativedelta
            fecha_mes_pasado = fecha_actual.replace(day=1) - relativedelta(months=1)
            query = query.filter(
                Consulta.fecha_consulta.month == fecha_mes_pasado.month,
                Consulta.fecha_consulta.year == fecha_mes_pasado.year
            )
        elif mostrar_desde == "Este año":
            query = query.filter(Consulta.fecha_consulta.year == fecha_actual.year)

        # Ordenar
        if ordenar_por == "Fecha (desc)":
            query = query.order_by(Consulta.fecha_consulta.desc())
        elif ordenar_por == "Fecha (asc)":
            query = query.order_by(Consulta.fecha_consulta.asc())
        elif ordenar_por == "Monto (desc)":
            query = query.order_by(Consulta.monto_ars.desc())
        elif ordenar_por == "Monto (asc)":
            query = query.order_by(Consulta.monto_ars.asc())
        elif ordenar_por == "Paciente":
            query = query.order_by(Consulta.paciente.nombre, Consulta.paciente.apellido)
        elif ordenar_por == "Tratamiento":
            query = query.order_by(Consulta.prestacion_usuario.nombre_personalizado)

        # Limitar cantidad
        if cantidad != "Todas":
            query = query.limit(int(cantidad))

        consultas = query.all()
        return [ConsultaOut.model_validate(c) for c in consultas]

    @staticmethod
    def aplicar_filtros_busqueda(
        db: Session,
        usuario_id: int,
        paciente: str = None,
        tratamiento: str = None,
        medio_pago: str = None,
        fecha_desde: datetime.date = None,
        fecha_hasta: datetime.date = None,
        rango_montos: tuple = None,
    ) -> List[ConsultaOut]:
        query = db.query(Consulta).filter(Consulta.usuario_id == usuario_id)

        # Filtro por paciente
        if paciente:
            query = query.filter(
                or_(
                    Consulta.paciente.nombre.ilike(f"%{paciente}%"),
                    Consulta.paciente.apellido.ilike(f"%{paciente}%"),
                )
            )

        # Filtro por tratamiento
        if tratamiento and tratamiento != "Todos":
            query = query.filter(Consulta.prestacion_usuario.nombre_personalizado == tratamiento)

        # Filtro por medio de pago
        if medio_pago and medio_pago != "Todos":
            query = query.filter(Consulta.medio_pago == medio_pago)

        # Filtro por fechas
        if fecha_desde and fecha_hasta:
            query = query.filter(
                Consulta.fecha_consulta >= fecha_desde,
                Consulta.fecha_consulta <= fecha_hasta
            )

        # Filtro por montos
        if rango_montos:
            query = query.filter(
                Consulta.monto_ars >= rango_montos[0],
                Consulta.monto_ars <= rango_montos[1]
            )

        consultas = query.all()
        return [ConsultaOut.model_validate(c) for c in consultas]
