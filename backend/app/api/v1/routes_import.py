from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import ImportCsvService

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/")
def import_csv(
    file: UploadFile = File(...),
    col_paciente: str = ...,
    col_tratamiento: str = ...,
    col_monto: str = ...,
    col_fecha: str = None,
    col_medio_pago: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    tenant = TenantContext(current_user)
    content = file.file.read()
    return ImportCsvService.importar_csv(
        db, tenant.user_id, content, col_paciente, col_tratamiento, col_monto, col_fecha, col_medio_pago
    )
