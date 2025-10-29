from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as health_router
from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_admin import router as admin_router
from app.api.v1.routes_pacientes import router as pacientes_router
from app.api.v1.routes_consultas import router as consultas_router
from app.api.v1.routes_gastos import router as gastos_router
from app.api.v1.routes_equipos import router as equipos_router
from app.api.v1.routes_compras import router as compras_router
from app.api.v1.routes_prestaciones_usuario import router as prestaciones_usuario_router
from app.api.v1.routes_config import router as config_router
from app.api.v1.routes_configuracion import router as configuracion_router
from app.api.v1.routes_prestaciones import router as prestaciones_router
from app.api.v1.routes_insumos import router as insumos_router
from app.api.v1.routes_analytics import router as analytics_new_router
from app.api.v1.routes_costos import router as costos_router
from app.api.v1.routes_consultas_utils import router as consultas_utils_router
from app.api.v1.routes_calculadora import router as calculadora_router
from app.api.v1.routes_import import router as import_router
from app.api.v1.routes_precios import router as precios_router
from app.api.v1.routes_turnos import router as turnos_router
from app.api.v1.routes_recordatorios import router as recordatorios_router
from app.core.config import get_settings
from app.core.logging import RequestIdMiddleware
from app.middleware.audit import AuditMiddleware

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
)

# Middleware (order matters - last added = first executed)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(AuditMiddleware)  # Audit middleware for tracking

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)
app.include_router(pacientes_router, prefix=settings.api_prefix)
app.include_router(consultas_router, prefix=settings.api_prefix)
app.include_router(gastos_router, prefix=settings.api_prefix)
app.include_router(equipos_router, prefix=settings.api_prefix)
app.include_router(compras_router, prefix=settings.api_prefix)
app.include_router(prestaciones_usuario_router, prefix=settings.api_prefix)
app.include_router(config_router, prefix=settings.api_prefix)
app.include_router(configuracion_router, prefix=settings.api_prefix)
app.include_router(prestaciones_router, prefix=settings.api_prefix)
app.include_router(insumos_router, prefix=settings.api_prefix)
app.include_router(analytics_new_router, prefix=settings.api_prefix)
app.include_router(costos_router, prefix=settings.api_prefix)
app.include_router(consultas_utils_router, prefix=settings.api_prefix)
app.include_router(calculadora_router, prefix=settings.api_prefix)
app.include_router(import_router, prefix=settings.api_prefix)
app.include_router(precios_router, prefix=settings.api_prefix)
app.include_router(turnos_router, prefix=settings.api_prefix)
app.include_router(recordatorios_router, prefix=settings.api_prefix)


@app.on_event("startup")
def startup_event():
    # Create tables if not exist
    from app.db.base import Base
    from app.db.session import engine, SessionLocal
    Base.metadata.create_all(bind=engine)
    
    # Initialize roles and permissions
    from app.services.role_service import RoleService
    db = SessionLocal()
    try:
        RoleService.initialize_roles_and_permissions(db)
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize roles: {e}")
    finally:
        db.close()
