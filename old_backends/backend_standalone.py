#!/usr/bin/env python3
"""
Standalone FastAPI backend for testing
"""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

# Configuration
JWT_SECRET_KEY = "super-secret-key-for-testing"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock users database
MOCK_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password_hash": pwd_context.hash("Homero123"),
        "nombre": "Dr. Administrador",
        "apellido": "",
        "email": "admin@manny.com",
        "especialidad": "odontologia",
        "plan": "premium",
        "fecha_registro": datetime.now().isoformat(),
        "activo": True
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def authenticate_user(username: str, password: str):
    user = MOCK_USERS.get(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

# FastAPI app
app = FastAPI(
    title="DentiProject Backend (Standalone)",
    description="Standalone backend for testing login",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/v1/health")
def health_check():
    return {"status": "ok", "message": "Standalone backend is running"}

@app.post("/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint - accepts admin/Homero123
    """
    print(f"Login attempt: username={form_data.username}")
    
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        print(f"Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user["username"])
    print(f"Login successful for user: {user['username']}")
    
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
    print("🚀 Starting DentiProject Backend...")
    print("📋 Available endpoints:")
    print("   - Health: http://localhost:8003/v1/health")
    print("   - Login: http://localhost:8003/v1/auth/login")
    print("   - Docs: http://localhost:8003/docs")
    print("🔐 Test credentials: admin / Homero123")
    
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
