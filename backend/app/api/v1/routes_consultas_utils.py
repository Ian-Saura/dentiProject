from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.schemas import ConsultaOut
from app.services import ConsultasUtilsService

router = APIRouter(prefix="/consultas", tags=["consultas-utils"])


@router.get("/busqueda", response_model=List[ConsultaOut])
def busqueda_consultas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    paciente: str = Query(None),
    tratamiento: str = Query(None),
    medio_pago: str = Query(None),
    fecha_desde: str = Query(None),
    fecha_hasta: str = Query(None),
    rango_montos: List[float] = Query(None),
):
    tenant = TenantContext(current_user)
    return ConsultasUtilsService.aplicar_filtros_busqueda(
        db, tenant.user_id, paciente, tratamiento, medio_pago, fecha_desde, fecha_hasta, rango_montos
    )


@router.get("/vista", response_model=List[ConsultaOut])
def vista_consultas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
    mostrar_desde: str = Query(...),
    cantidad: str = Query("Todas"),
    ordenar_por: str = Query("Fecha (desc)"),
):
    tenant = TenantContext(current_user)
    return ConsultasUtilsService.aplicar_filtros_visualizacion(
        db, tenant.user_id, mostrar_desde, cantidad, ordenar_por
    )
