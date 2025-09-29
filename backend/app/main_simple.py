"""
Simplified FastAPI app for testing without database
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.routes_auth_mock import router as auth_router

app = FastAPI(
    title="DentiProject Backend (Mock)",
    description="Simplified backend for testing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/v1")

@app.get("/v1/health")
def health_check():
    return {"status": "ok", "message": "Mock backend is running"}

@app.get("/v1/analytics/resumen")
def get_resumen_mock():
    """Mock analytics data"""
    return {
        "total_consultas": 25,
        "ingreso_total": 750000,
        "promedio_consulta": 30000,
        "tratamiento_popular": "Consulta",
        "ingresos_mes": 150000
    }

@app.get("/v1/analytics/kpis")
def get_kpis_mock():
    """Mock KPI data"""
    return {
        "dias_desde_ultima_consulta": 2,
        "consultas_ultima_semana": 8,
        "ingreso_promedio_diario": 25000,
        "crecimiento_mensual": 15.5
    }

@app.get("/v1/costos/analisis")
def get_costos_mock():
    """Mock cost analysis"""
    return {
        "costo_hora_ars": 28500,
        "costo_equipos_anual": 150000,
        "costo_gastos_anual": 2400000,
        "costo_total_anual": 2550000,
        "horas_anuales": 1100,
        "cantidad_equipos": 3,
        "cantidad_gastos": 4
    }

@app.post("/v1/calculadora/recomendaciones")
def calculadora_mock(tiempo_horas: float = 1.5, costo_materiales_ars: float = 5000, usar_costo_real: bool = False):
    """Mock calculator recommendations"""
    costo_hora = 28500 if usar_costo_real else 29000
    costo_total = (tiempo_horas * costo_hora) + costo_materiales_ars
    
    margenes = {
        "Supervivencia (25%)": 0.25,
        "Competitivo (50%)": 0.50,
        "Premium (75%)": 0.75,
        "Especialista (100%)": 1.00,
    }
    
    recomendaciones = []
    for nombre_margen, porcentaje_margen in margenes.items():
        precio_final = costo_total * (1 + porcentaje_margen)
        ganancia = precio_final - costo_total
        
        recomendaciones.append({
            "margen": nombre_margen,
            "precio": round(precio_final, 0),
            "ganancia": round(ganancia, 0),
            "valor": precio_final
        })
    
    return recomendaciones

@app.get("/v1/consultas")
def get_consultas_mock():
    """Mock consultations data"""
    return [
        {
            "id": 1,
            "fecha_consulta": "2025-09-28",
            "monto_ars": 35000,
            "medio_pago": "efectivo",
            "estado": "completada",
            "paciente": {"nombre": "Juan", "apellido": "Pérez"},
            "prestacion_usuario": {"nombre_personalizado": "Consulta General"}
        },
        {
            "id": 2,
            "fecha_consulta": "2025-09-27",
            "monto_ars": 65000,
            "medio_pago": "transferencia",
            "estado": "completada",
            "paciente": {"nombre": "María", "apellido": "González"},
            "prestacion_usuario": {"nombre_personalizado": "Operatoria Simple"}
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
