from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria, TipoAccion, EntidadTipo
from app.schemas.auditoria import AuditoriaCreate, AuditoriaFilter


class AuditoriaService:
    """Servicio para gestión de auditoría"""
    
    @staticmethod
    def create(db: Session, audit_data: AuditoriaCreate) -> Auditoria:
        """Crear registro de auditoría"""
        audit = Auditoria(
            usuario_id=audit_data.usuario_id,
            accion=audit_data.accion,
            entidad_tipo=audit_data.entidad_tipo,
            entidad_id=audit_data.entidad_id,
            descripcion=audit_data.descripcion,
            metadata_json=audit_data.metadata_json,
            ip_address=audit_data.ip_address,
            user_agent=audit_data.user_agent,
            endpoint=audit_data.endpoint,
            metodo_http=audit_data.metodo_http,
            exitoso=audit_data.exitoso,
            error_mensaje=audit_data.error_mensaje,
            duracion_ms=audit_data.duracion_ms,
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
    
    @staticmethod
    def get_by_filters(db: Session, filters: AuditoriaFilter) -> tuple[List[Auditoria], int]:
        """Obtener auditorías con filtros"""
        query = db.query(Auditoria)
        
        if filters.usuario_id:
            query = query.filter(Auditoria.usuario_id == filters.usuario_id)
        
        if filters.accion:
            query = query.filter(Auditoria.accion == filters.accion)
        
        if filters.entidad_tipo:
            query = query.filter(Auditoria.entidad_tipo == filters.entidad_tipo)
        
        if filters.fecha_desde:
            query = query.filter(Auditoria.fecha_hora >= filters.fecha_desde)
        
        if filters.fecha_hasta:
            query = query.filter(Auditoria.fecha_hora <= filters.fecha_hasta)
        
        if filters.exitoso is not None:
            query = query.filter(Auditoria.exitoso == filters.exitoso)
        
        # Count total
        total = query.count()
        
        # Apply pagination
        audits = query.order_by(desc(Auditoria.fecha_hora))\
            .limit(filters.limit)\
            .offset(filters.offset)\
            .all()
        
        return audits, total
    
    @staticmethod
    def get_analytics(db: Session, dias: int = 30) -> dict:
        """Obtener analytics de auditoría"""
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        # Total de acciones
        total_acciones = db.query(func.count(Auditoria.id))\
            .filter(Auditoria.fecha_hora >= fecha_limite)\
            .scalar()
        
        # Acciones por tipo
        acciones_por_tipo = db.query(
            Auditoria.accion,
            func.count(Auditoria.id)
        ).filter(Auditoria.fecha_hora >= fecha_limite)\
         .group_by(Auditoria.accion)\
         .all()
        
        # Usuarios activos (únicos que hicieron alguna acción)
        usuarios_activos = db.query(func.count(func.distinct(Auditoria.usuario_id)))\
            .filter(Auditoria.fecha_hora >= fecha_limite)\
            .filter(Auditoria.usuario_id.isnot(None))\
            .scalar()
        
        # Acciones exitosas vs fallidas
        exitosas = db.query(func.count(Auditoria.id))\
            .filter(Auditoria.fecha_hora >= fecha_limite)\
            .filter(Auditoria.exitoso == True)\
            .scalar()
        
        fallidas = db.query(func.count(Auditoria.id))\
            .filter(Auditoria.fecha_hora >= fecha_limite)\
            .filter(Auditoria.exitoso == False)\
            .scalar()
        
        # Promedio de duración
        promedio_duracion = db.query(func.avg(Auditoria.duracion_ms))\
            .filter(Auditoria.fecha_hora >= fecha_limite)\
            .filter(Auditoria.duracion_ms.isnot(None))\
            .scalar()
        
        # Endpoints más usados
        endpoints_mas_usados = db.query(
            Auditoria.endpoint,
            func.count(Auditoria.id).label('count')
        ).filter(Auditoria.fecha_hora >= fecha_limite)\
         .filter(Auditoria.endpoint.isnot(None))\
         .group_by(Auditoria.endpoint)\
         .order_by(desc('count'))\
         .limit(10)\
         .all()
        
        # Errores más comunes
        errores_comunes = db.query(
            Auditoria.error_mensaje,
            func.count(Auditoria.id).label('count')
        ).filter(Auditoria.fecha_hora >= fecha_limite)\
         .filter(Auditoria.exitoso == False)\
         .filter(Auditoria.error_mensaje.isnot(None))\
         .group_by(Auditoria.error_mensaje)\
         .order_by(desc('count'))\
         .limit(10)\
         .all()
        
        return {
            "total_acciones": total_acciones or 0,
            "acciones_por_tipo": {accion: count for accion, count in acciones_por_tipo},
            "usuarios_activos": usuarios_activos or 0,
            "acciones_exitosas": exitosas or 0,
            "acciones_fallidas": fallidas or 0,
            "promedio_duracion_ms": float(promedio_duracion) if promedio_duracion else None,
            "endpoints_mas_usados": [
                {"endpoint": endpoint, "count": count}
                for endpoint, count in endpoints_mas_usados
            ],
            "errores_comunes": [
                {"error": error, "count": count}
                for error, count in errores_comunes
            ]
        }
    
    @staticmethod
    def log_action(
        db: Session,
        usuario_id: Optional[int],
        accion: str,
        entidad_tipo: Optional[str] = None,
        entidad_id: Optional[int] = None,
        descripcion: Optional[str] = None,
        metadata: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        metodo_http: Optional[str] = None,
        exitoso: bool = True,
        error_mensaje: Optional[str] = None,
        duracion_ms: Optional[int] = None,
    ) -> Auditoria:
        """Helper para crear log de auditoría rápidamente"""
        audit_data = AuditoriaCreate(
            usuario_id=usuario_id,
            accion=accion,
            entidad_tipo=entidad_tipo,
            entidad_id=entidad_id,
            descripcion=descripcion,
            metadata_json=metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            metodo_http=metodo_http,
            exitoso=exitoso,
            error_mensaje=error_mensaje,
            duracion_ms=duracion_ms,
        )
        return AuditoriaService.create(db, audit_data)

