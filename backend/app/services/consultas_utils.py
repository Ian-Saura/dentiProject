from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional

from sqlalchemy import or_, extract
from sqlalchemy.orm import Session, joinedload

from app.models import Consulta, Paciente, PrestacionUsuario
from app.schemas import ConsultaOut


class ConsultasUtilsService:
    @staticmethod
    def aplicar_filtros_visualizacion(
        db: Session, usuario_id: int, mostrar_desde: str, cantidad: str, ordenar_por: str
    ) -> List[ConsultaOut]:
        query = db.query(Consulta).filter(
            Consulta.usuario_id == usuario_id
        ).options(
            joinedload(Consulta.paciente),
            joinedload(Consulta.prestacion_usuario),
        )

        fecha_actual = datetime.now()
        if mostrar_desde == "Este mes":
            first_day = date(fecha_actual.year, fecha_actual.month, 1)
            query = query.filter(Consulta.fecha_consulta >= first_day)
        elif mostrar_desde == "Último mes":
            if fecha_actual.month == 1:
                prev_year, prev_month = fecha_actual.year - 1, 12
            else:
                prev_year, prev_month = fecha_actual.year, fecha_actual.month - 1
            first_day = date(prev_year, prev_month, 1)
            last_day = date(fecha_actual.year, fecha_actual.month, 1) - timedelta(days=1)
            query = query.filter(
                Consulta.fecha_consulta >= first_day,
                Consulta.fecha_consulta <= last_day,
            )
        elif mostrar_desde == "Este año":
            first_day = date(fecha_actual.year, 1, 1)
            query = query.filter(Consulta.fecha_consulta >= first_day)

        if ordenar_por == "Fecha (desc)":
            query = query.order_by(Consulta.fecha_consulta.desc())
        elif ordenar_por == "Fecha (asc)":
            query = query.order_by(Consulta.fecha_consulta.asc())
        elif ordenar_por == "Monto (desc)":
            query = query.order_by(Consulta.monto_ars.desc())
        elif ordenar_por == "Monto (asc)":
            query = query.order_by(Consulta.monto_ars.asc())
        elif ordenar_por == "Paciente":
            query = query.join(Paciente, Consulta.paciente_id == Paciente.id).order_by(
                Paciente.nombre, Paciente.apellido
            )
        elif ordenar_por == "Tratamiento":
            query = query.join(
                PrestacionUsuario, Consulta.prestacion_usuario_id == PrestacionUsuario.id
            ).order_by(PrestacionUsuario.nombre_personalizado)
        else:
            query = query.order_by(Consulta.fecha_consulta.desc())

        if cantidad != "Todas":
            try:
                query = query.limit(int(cantidad))
            except ValueError:
                pass

        consultas = query.all()
        return [ConsultaOut.model_validate(c) for c in consultas]

    @staticmethod
    def aplicar_filtros_busqueda(
        db: Session,
        usuario_id: int,
        paciente: Optional[str] = None,
        tratamiento: Optional[str] = None,
        medio_pago: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        rango_montos: Optional[tuple] = None,
    ) -> List[ConsultaOut]:
        query = db.query(Consulta).filter(
            Consulta.usuario_id == usuario_id
        ).options(
            joinedload(Consulta.paciente),
            joinedload(Consulta.prestacion_usuario),
        )

        if paciente:
            query = query.join(Paciente, Consulta.paciente_id == Paciente.id).filter(
                or_(
                    Paciente.nombre.ilike(f"%{paciente}%"),
                    Paciente.apellido.ilike(f"%{paciente}%"),
                )
            )

        if tratamiento and tratamiento != "Todos":
            query = query.join(
                PrestacionUsuario, Consulta.prestacion_usuario_id == PrestacionUsuario.id
            ).filter(PrestacionUsuario.nombre_personalizado == tratamiento)

        if medio_pago and medio_pago != "Todos":
            query = query.filter(Consulta.medio_pago == medio_pago)

        if fecha_desde:
            query = query.filter(Consulta.fecha_consulta >= fecha_desde)
        if fecha_hasta:
            query = query.filter(Consulta.fecha_consulta <= fecha_hasta)

        if rango_montos:
            query = query.filter(
                Consulta.monto_ars >= rango_montos[0],
                Consulta.monto_ars <= rango_montos[1]
            )

        consultas = query.all()
        return [ConsultaOut.model_validate(c) for c in consultas]
