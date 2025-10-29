"""
Cron Job: Enviar Recordatorios Diarios
Ejecutar este script diariamente (ej: a las 9 AM) para enviar recordatorios automáticos
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session
from loguru import logger
from app.db.base import SessionLocal
from app.models.usuarios import Usuario
from app.services.recordatorios_service import recordatorios_service


def enviar_recordatorios_a_todos_los_usuarios():
    """
    Envía recordatorios automáticos para todos los usuarios activos
    """
    db: Session = SessionLocal()
    
    try:
        # Obtener todos los usuarios activos
        usuarios = db.query(Usuario).filter(Usuario.activo == True).all()
        
        logger.info(f"Iniciando envío de recordatorios para {len(usuarios)} usuarios")
        
        total_enviados = 0
        total_fallidos = 0
        
        for usuario in usuarios:
            try:
                logger.info(f"Procesando recordatorios para usuario {usuario.id} ({usuario.nombre})")
                
                # Enviar recordatorios 24 horas antes (dias_anticipacion=1)
                result = recordatorios_service.enviar_recordatorios_automaticos(
                    db=db,
                    usuario_id=usuario.id,
                    dias_anticipacion=1,  # 24 horas antes
                    metodo="auto"  # Intenta WhatsApp, si falla usa SMS
                )
                
                total_enviados += result.get("enviados", 0)
                total_fallidos += result.get("fallidos", 0)
                
                logger.info(
                    f"Usuario {usuario.id}: {result.get('enviados', 0)} enviados, "
                    f"{result.get('fallidos', 0)} fallidos"
                )
                
            except Exception as e:
                logger.error(f"Error procesando usuario {usuario.id}: {str(e)}")
                continue
        
        logger.success(
            f"✅ Recordatorios diarios completados: "
            f"{total_enviados} enviados, {total_fallidos} fallidos"
        )
        
        return {
            "success": True,
            "usuarios_procesados": len(usuarios),
            "total_enviados": total_enviados,
            "total_fallidos": total_fallidos
        }
        
    except Exception as e:
        logger.error(f"Error en job de recordatorios diarios: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


if __name__ == "__main__":
    logger.add(
        "logs/recordatorios_diarios.log",
        rotation="1 week",
        retention="1 month",
        level="INFO"
    )
    
    logger.info("=" * 80)
    logger.info("🔔 Iniciando job de recordatorios diarios")
    logger.info("=" * 80)
    
    result = enviar_recordatorios_a_todos_los_usuarios()
    
    if result.get("success"):
        logger.success("✅ Job completado exitosamente")
        sys.exit(0)
    else:
        logger.error(f"❌ Job falló: {result.get('error')}")
        sys.exit(1)

