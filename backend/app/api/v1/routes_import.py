from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, TenantContext, require_roles
from app.models import Usuario
from app.models.consultas import Consulta
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
        # Validar tipo de archivo
        if not file.filename.endswith('.csv'):
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "error": "Solo se permiten archivos CSV"
            }
        
        # Validar tamaño de archivo (máximo 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        content = file.file.read()
        
        if len(content) > MAX_FILE_SIZE:
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "error": "El archivo excede el tamaño máximo permitido (10MB)"
            }
        
        if not content:
            return {
                "migrados": 0,
                "errores": 1,
                "total_ars": 0,
                "error": "El archivo está vacío"
            }
        
        tenant = TenantContext(current_user)
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



@router.post("/clear-hashes")
def clear_my_import_hashes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _ = Depends(require_roles()),
):
    """
    Limpiar los hashes de importación del usuario actual.
    Esto permite re-importar datos sin que sean detectados como duplicados.
    
    Disponible para todos los planes (trial, premium, enterprise).
    """
    # Limpiar los hashes del usuario actual
    result = db.query(Consulta).filter(
        Consulta.usuario_id == current_user.id,
        Consulta.import_hash.isnot(None)
    ).update({"import_hash": None})
    
    db.commit()
    
    return {
        "message": f"Se limpiaron {result} hashes de importación",
        "cleared_count": result
    }

    tenant = TenantContext(current_user)
    content = file.file.read()
    return ImportCsvService.importar_csv(
        db, tenant.user_id, content, col_paciente, col_tratamiento, col_monto, col_fecha, col_medio_pago
    )
