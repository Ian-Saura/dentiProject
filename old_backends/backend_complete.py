#!/usr/bin/env python3
"""
Complete FastAPI backend with all endpoints for DentiProject
"""
from fastapi import FastAPI, HTTPException, status, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import hashlib
import jwt

# Configuration
JWT_SECRET_KEY = "super-secret-key-for-testing"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def simple_hash(password: str) -> str:
    """Simple SHA256 hash for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using simple hash"""
    return simple_hash(plain_password) == hashed_password

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

# Mock users database with simple hash
MOCK_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password_hash": simple_hash("Homero123"),  # Simple hash instead of bcrypt
        "nombre": "Dr. Administrador",
        "apellido": "",
        "email": "admin@manny.com",
        "especialidad": "odontologia",
        "plan": "premium",
        "fecha_registro": datetime.now().isoformat(),
        "activo": True
    }
}

def authenticate_user(username: str, password: str):
    user = MOCK_USERS.get(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

# FastAPI app
app = FastAPI(
    title="DentiProject Backend (Complete)",
    description="Complete backend with all endpoints for testing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "DentiProject Complete Backend is running!", "status": "ok"}

@app.get("/v1/health")
def health_check():
    return {"status": "ok", "message": "Complete backend is running"}

@app.post("/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint - accepts admin/Homero123
    """
    print(f"🔐 Login attempt: username={form_data.username}")
    
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        print(f"❌ Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user["username"])
    print(f"✅ Login successful for user: {user['username']}")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "nombre": user["nombre"],
            "email": user["email"],
            "especialidad": user["especialidad"],
            "plan": user["plan"]
        }
    }

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

@app.get("/v1/consultas")
def get_consultas_mock(limit: int = Query(25), order_by: str = Query("fecha")):
    """Mock consultations data"""
    return [
        {
            "id": 1,
            "fecha_consulta": "2025-09-28T10:30:00",
            "monto_ars": 35000,
            "medio_pago": "efectivo",
            "estado": "completada",
            "paciente": {"nombre": "Juan", "apellido": "Pérez"},
            "prestacion_usuario": {"nombre_personalizado": "Consulta General"}
        },
        {
            "id": 2,
            "fecha_consulta": "2025-09-27T15:45:00",
            "monto_ars": 65000,
            "medio_pago": "transferencia",
            "estado": "completada",
            "paciente": {"nombre": "María", "apellido": "González"},
            "prestacion_usuario": {"nombre_personalizado": "Operatoria Simple"}
        },
        {
            "id": 3,
            "fecha_consulta": "2025-09-26T09:15:00",
            "monto_ars": 45000,
            "medio_pago": "débito",
            "estado": "completada",
            "paciente": {"nombre": "Carlos", "apellido": "López"},
            "prestacion_usuario": {"nombre_personalizado": "Limpieza"}
        },
        {
            "id": 4,
            "fecha_consulta": "2025-09-25T14:20:00",
            "monto_ars": 85000,
            "medio_pago": "crédito",
            "estado": "completada",
            "paciente": {"nombre": "Ana", "apellido": "Martínez"},
            "prestacion_usuario": {"nombre_personalizado": "Endodoncia"}
        },
        {
            "id": 5,
            "fecha_consulta": "2025-09-24T11:00:00",
            "monto_ars": 55000,
            "medio_pago": "transferencia",
            "estado": "completada",
            "paciente": {"nombre": "Luis", "apellido": "Rodríguez"},
            "prestacion_usuario": {"nombre_personalizado": "Operatoria Compleja"}
        }
    ]

@app.post("/v1/calculadora/recomendaciones")
def calculadora_mock(
    tiempo_horas: float = Query(1.5), 
    costo_materiales_ars: float = Query(5000), 
    usar_costo_real: bool = Query(False)
):
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

@app.get("/v1/pacientes")
def get_pacientes_mock():
    """Mock patients data"""
    return [
        {
            "id": 1,
            "nombre": "Juan",
            "apellido": "Pérez",
            "email": "juan.perez@email.com",
            "telefono": "+54 11 1234-5678",
            "fecha_nacimiento": "1985-03-15",
            "activo": True
        },
        {
            "id": 2,
            "nombre": "María",
            "apellido": "González",
            "email": "maria.gonzalez@email.com",
            "telefono": "+54 11 2345-6789",
            "fecha_nacimiento": "1990-07-22",
            "activo": True
        },
        {
            "id": 3,
            "nombre": "Carlos",
            "apellido": "López",
            "email": "carlos.lopez@email.com",
            "telefono": "+54 11 3456-7890",
            "fecha_nacimiento": "1978-11-08",
            "activo": True
        }
    ]

@app.get("/v1/equipos")
def get_equipos_mock():
    """Mock equipment data"""
    return [
        {
            "id": 1,
            "nombre": "Sillón Dental Premium",
            "monto_compra_usd": 8500,
            "anios_vida_util": 10,
            "fecha_compra": "2023-01-15",
            "observaciones": "Sillón principal del consultorio",
            "activo": True
        },
        {
            "id": 2,
            "nombre": "Equipo de Rayos X",
            "monto_compra_usd": 12000,
            "anios_vida_util": 8,
            "fecha_compra": "2022-06-20",
            "observaciones": "Equipo digital de última generación",
            "activo": True
        },
        {
            "id": 3,
            "nombre": "Autoclave",
            "monto_compra_usd": 3500,
            "anios_vida_util": 7,
            "fecha_compra": "2023-03-10",
            "observaciones": "Para esterilización de instrumentos",
            "activo": True
        }
    ]

@app.get("/v1/gastos")
def get_gastos_mock():
    """Mock fixed expenses data"""
    return [
        {
            "id": 1,
            "concepto": "Alquiler del consultorio",
            "monto_mensual_ars": 180000,
            "activo": True
        },
        {
            "id": 2,
            "concepto": "Servicios (luz, gas, agua)",
            "monto_mensual_ars": 45000,
            "activo": True
        },
        {
            "id": 3,
            "concepto": "Internet y teléfono",
            "monto_mensual_ars": 25000,
            "activo": True
        },
        {
            "id": 4,
            "concepto": "Seguro profesional",
            "monto_mensual_ars": 35000,
            "activo": True
        }
    ]

@app.get("/v1/prestaciones")
def get_prestaciones_mock():
    """Mock services catalog"""
    return [
        {
            "id": 1,
            "nombre": "Consulta General",
            "descripcion": "Consulta odontológica general",
            "precio_base_ars": 25000,
            "activo": True
        },
        {
            "id": 2,
            "nombre": "Limpieza",
            "descripcion": "Profilaxis dental completa",
            "precio_base_ars": 35000,
            "activo": True
        },
        {
            "id": 3,
            "nombre": "Operatoria Simple",
            "descripcion": "Restauración dental simple",
            "precio_base_ars": 45000,
            "activo": True
        },
        {
            "id": 4,
            "nombre": "Operatoria Compleja",
            "descripcion": "Restauración dental compleja",
            "precio_base_ars": 65000,
            "activo": True
        },
        {
            "id": 5,
            "nombre": "Endodoncia",
            "descripcion": "Tratamiento de conducto",
            "precio_base_ars": 85000,
            "activo": True
        }
    ]

@app.get("/v1/prestaciones-usuario")
def get_prestaciones_usuario_mock():
    """Mock user services"""
    return [
        {
            "id": 1,
            "prestacion_id": 1,
            "nombre_personalizado": "Consulta General",
            "precio_personalizado_ars": 30000,
            "activo": True
        },
        {
            "id": 2,
            "prestacion_id": 2,
            "nombre_personalizado": "Limpieza",
            "precio_personalizado_ars": 40000,
            "activo": True
        },
        {
            "id": 3,
            "prestacion_id": 3,
            "nombre_personalizado": "Operatoria Simple",
            "precio_personalizado_ars": 50000,
            "activo": True
        }
    ]

# Additional endpoints that might be called by the frontend
@app.get("/v1/consultas/busqueda")
def busqueda_consultas_mock():
    """Mock consultation search"""
    return get_consultas_mock()

@app.get("/v1/consultas/vista")
def vista_consultas_mock():
    """Mock consultation view"""
    return get_consultas_mock()

@app.post("/v1/import")
def import_csv_mock():
    """Mock CSV import"""
    return {"message": "CSV import functionality not implemented in mock", "status": "mock"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Complete DentiProject Backend...")
    print("📋 Available endpoints:")
    print("   - Root: http://localhost:8004/")
    print("   - Health: http://localhost:8004/v1/health")
    print("   - Login: http://localhost:8004/v1/auth/login")
    print("   - Analytics: http://localhost:8004/v1/analytics/*")
    print("   - Costs: http://localhost:8004/v1/costos/*")
    print("   - Consultations: http://localhost:8004/v1/consultas")
    print("   - Calculator: http://localhost:8004/v1/calculadora/*")
    print("   - Patients: http://localhost:8004/v1/pacientes")
    print("   - Equipment: http://localhost:8004/v1/equipos")
    print("   - Expenses: http://localhost:8004/v1/gastos")
    print("   - Services: http://localhost:8004/v1/prestaciones*")
    print("   - Docs: http://localhost:8004/docs")
    print("🔐 Test credentials: admin / Homero123")
    
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")
