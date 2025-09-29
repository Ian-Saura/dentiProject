from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.routes import router as health_router
from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_pacientes import router as pacientes_router
from app.api.v1.routes_consultas import router as consultas_router
from app.api.v1.routes_gastos import router as gastos_router
from app.api.v1.routes_equipos import router as equipos_router
from app.api.v1.routes_compras import router as compras_router
from app.api.v1.routes_prestaciones_usuario import router as prestaciones_usuario_router
from app.api.v1.routes_config import router as config_router
from app.api.v1.routes_prestaciones import router as prestaciones_router
from app.api.v1.routes_insumos import router as insumos_router
from app.api.v1.routes_analytics import router as analytics_router
from app.api.v1.routes_costos import router as costos_router
from app.api.v1.routes_consultas_utils import router as consultas_utils_router
from app.api.v1.routes_calculadora import router as calculadora_router
from app.api.v1.routes_import import router as import_router
from app.api.v1.routes_precios import router as precios_router
from app.core.config import get_settings
from app.core.logging import RequestIdMiddleware

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestIdMiddleware)

# Routers
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(pacientes_router, prefix=settings.api_prefix)
app.include_router(consultas_router, prefix=settings.api_prefix)
app.include_router(gastos_router, prefix=settings.api_prefix)
app.include_router(equipos_router, prefix=settings.api_prefix)
app.include_router(compras_router, prefix=settings.api_prefix)
app.include_router(prestaciones_usuario_router, prefix=settings.api_prefix)
app.include_router(config_router, prefix=settings.api_prefix)
app.include_router(prestaciones_router, prefix=settings.api_prefix)
app.include_router(insumos_router, prefix=settings.api_prefix)
app.include_router(analytics_router, prefix=settings.api_prefix)
app.include_router(costos_router, prefix=settings.api_prefix)
app.include_router(consultas_utils_router, prefix=settings.api_prefix)
app.include_router(calculadora_router, prefix=settings.api_prefix)
app.include_router(import_router, prefix=settings.api_prefix)
app.include_router(precios_router, prefix=settings.api_prefix)


@app.on_event("startup")
def startup_event():
    # Create tables if not exist
    from app.db.base import Base
    from app.db.session import engine
    Base.metadata.create_all(bind=engine)
