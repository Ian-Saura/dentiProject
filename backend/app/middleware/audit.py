from __future__ import annotations

import time
import uuid
from typing import Callable
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.db.session import SessionLocal
from app.services.auditoria import AuditoriaService

# Thread pool para ejecutar tareas de auditoría en background
executor = ThreadPoolExecutor(max_workers=2)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware para auditoría automática de todas las requests.
    Captura información relevante y la almacena en la base de datos.
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Endpoints que NO queremos auditar (para evitar spam)
        self.excluded_paths = {
            "/v1/health",
            "/v1/docs",
            "/v1/openapi.json",
            "/v1/redoc",
            "/favicon.ico",
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Procesar request y crear log de auditoría"""
        
        # Generar request ID único
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Timestamp inicial
        start_time = time.time()
        
        # Ejecutar request
        response = await call_next(request)
        
        # Calcular duración
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Verificar si debemos auditar este endpoint
        path = request.url.path
        if path in self.excluded_paths or path.startswith("/v1/static"):
            return response
        
        # Crear log de auditoría en background (no bloqueante)
        # Extraer datos necesarios antes de que el response se cierre
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        endpoint = request.url.path
        metodo_http = request.method
        usuario_id = getattr(request.state, "user_id", None)
        status_code = response.status_code
        
        # Ejecutar en background sin esperar
        asyncio.create_task(
            self._create_audit_log_async(
                usuario_id=usuario_id,
                metodo_http=metodo_http,
                endpoint=endpoint,
                status_code=status_code,
                duration_ms=duration_ms,
                request_id=request_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
        )
        
        # Agregar headers de tracking
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        
        return response
    
    async def _create_audit_log_async(
        self,
        usuario_id: int | None,
        metodo_http: str,
        endpoint: str,
        status_code: int,
        duration_ms: int,
        request_id: str,
        ip_address: str,
        user_agent: str
    ):
        """Crear registro de auditoría en la base de datos de forma asíncrona"""
        try:
            # Ejecutar en thread pool para no bloquear el event loop
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                executor,
                self._create_audit_log_sync,
                usuario_id,
                metodo_http,
                endpoint,
                status_code,
                duration_ms,
                request_id,
                ip_address,
                user_agent
            )
        except Exception as e:
            # No queremos que falle si falla la auditoría
            print(f"⚠️  Error creating audit log: {e}")
    
    def _create_audit_log_sync(
        self,
        usuario_id: int | None,
        metodo_http: str,
        endpoint: str,
        status_code: int,
        duration_ms: int,
        request_id: str,
        ip_address: str,
        user_agent: str
    ):
        """Crear registro de auditoría (versión síncrona para thread pool)"""
        db = SessionLocal()
        try:
            # Determinar acción basada en método HTTP y path
            accion = self._determine_action(metodo_http, endpoint)
            
            # Determinar entidad y tipo
            entidad_tipo = self._determine_entity_type(endpoint)
            
            # Verificar si fue exitoso (2xx o 3xx)
            exitoso = 200 <= status_code < 400
            
            # Crear log
            AuditoriaService.log_action(
                db=db,
                usuario_id=usuario_id,
                accion=accion,
                entidad_tipo=entidad_tipo,
                descripcion=f"{metodo_http} {endpoint}",
                metadata={
                    "request_id": request_id,
                    "status_code": status_code,
                },
                ip_address=ip_address,
                user_agent=user_agent[:500] if user_agent else None,
                endpoint=endpoint,
                metodo_http=metodo_http,
                exitoso=exitoso,
                duracion_ms=duration_ms,
            )
        finally:
            db.close()
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP real del cliente (considerando proxies)"""
        # Intentar headers de proxy primero
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback a IP directa
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _determine_action(self, method: str, endpoint: str) -> str:
        """Determinar tipo de acción basado en método HTTP"""
        # Casos especiales
        if "/login" in endpoint:
            return "login"
        if "/logout" in endpoint:
            return "logout"
        if "/register" in endpoint:
            return "registro"
        if "/import" in endpoint:
            return "importar"
        if "/export" in endpoint:
            return "exportar"
        
        # Mapeo general
        action_map = {
            "GET": "leer",
            "POST": "crear",
            "PUT": "actualizar",
            "PATCH": "actualizar",
            "DELETE": "eliminar",
        }
        
        return action_map.get(method, "leer")
    
    def _determine_entity_type(self, endpoint: str) -> str | None:
        """Determinar tipo de entidad basado en endpoint"""
        if "/pacientes" in endpoint:
            return "paciente"
        if "/consultas" in endpoint:
            return "consulta"
        if "/prestaciones" in endpoint:
            return "prestacion"
        if "/gastos" in endpoint:
            return "gasto_fijo"
        if "/equipos" in endpoint:
            return "equipo"
        if "/compras" in endpoint:
            return "compra"
        if "/configuracion" in endpoint:
            return "configuracion"
        if "/insumos" in endpoint:
            return "insumo"
        if "/usuarios" in endpoint or "/auth" in endpoint:
            return "usuario"
        
        return None

