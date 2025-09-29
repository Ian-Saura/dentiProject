from __future__ import annotations

from typing import Dict, List, Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import VPrestacionPrecio


class PreciosService:
    @staticmethod
    def list_precios(
        db: Session,
        usuario_id: int,
        *,
        limit: int = 50,
        offset: int = 0,
        order_by: str = None,
        filtros: Dict[str, Any] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        query = select(VPrestacionPrecio).where(VPrestacionPrecio.usuario_id == usuario_id)

        if filtros:
            if "codigo" in filtros and filtros["codigo"]:
                query = query.where(VPrestacionPrecio.codigo.ilike(f"%{filtros['codigo']}%"))
            if "nombre" in filtros and filtros["nombre"]:
                query = query.where(VPrestacionPrecio.nombre_prestacion.ilike(f"%{filtros['nombre']}%"))

        # Whitelist order_by
        allowed_orders = {
            "codigo": VPrestacionPrecio.codigo,
            "nombre_prestacion": VPrestacionPrecio.nombre_prestacion,
            "tiempo_min": VPrestacionPrecio.tiempo_min,
            "costo_insumos_estimado": VPrestacionPrecio.costo_insumos_estimado,
        }
        if order_by and order_by in allowed_orders:
            query = query.order_by(allowed_orders[order_by])
        else:
            query = query.order_by(VPrestacionPrecio.codigo)

        # For simplicity, since it's a view, count via list
        all_results = db.execute(query).scalars().all()
        total = len(all_results)
        results = all_results[offset:offset + limit]

        # Convert to dict for API
        precios = []
        for p in results:
            precios.append({
                "prestacion_usuario_id": p.prestacion_usuario_id,
                "usuario_id": p.usuario_id,
                "profesional": p.profesional,
                "codigo": p.codigo,
                "nombre_prestacion": p.nombre_prestacion,
                "tiempo_min": p.tiempo_min,
                "margen_ganancia_porcentaje": p.margen_ganancia_porcentaje,
                "costo_insumos_estimado": p.costo_insumos_estimado,
            })

        return precios, total
