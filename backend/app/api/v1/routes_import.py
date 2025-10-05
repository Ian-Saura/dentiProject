from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.services import ImportCsvService

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/")
def import_csv(
    file: UploadFile = File(...),
    col_paciente: str = Form(...),
    col_tratamiento: str = Form(...),
    col_monto: str = Form(...),
    col_fecha: Optional[str] = Form(None),
    col_medio_pago: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """
    Importar consultas desde archivo CSV
    
    Args:
        file: Archivo CSV
        col_paciente: Nombre de la columna del paciente
        col_tratamiento: Nombre de la columna del tratamiento
        col_monto: Nombre de la columna del monto
        col_fecha: Nombre de la columna de fecha (opcional)
        col_medio_pago: Nombre de la columna del medio de pago (opcional)
    
    Returns:
        Diccionario con resultado de la importación
    """
    try:
        tenant = TenantContext(current_user)
        content = file.file.read()
        
        if not content:
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "error": "El archivo está vacío"
            }
        
        result = ImportCsvService.importar_csv(
            db, tenant.user_id, content, col_paciente, col_tratamiento, col_monto, col_fecha, col_medio_pago
        )
        
        return result
        
    except Exception as e:
        import traceback
        print(f"Error en importación CSV: {str(e)}")
        print(traceback.format_exc())
        return {
            "migrados": 0,
            "errores": 1,
            "total_ars": 0,
            "error": f"Error al procesar archivo: {str(e)}"
        }
