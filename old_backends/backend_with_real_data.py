#!/usr/bin/env python3
"""
Complete FastAPI backend using real data from ingresos.csv
"""
from fastapi import FastAPI, HTTPException, status, Depends, Query, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import hashlib
import jwt
import pandas as pd
import re
import io
from typing import List, Dict, Any

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

# Mock users database
MOCK_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password_hash": simple_hash("Homero123"),
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

# Data processing functions
def extraer_monto_numerico(monto_str):
    """Extract numeric value from amount string"""
    try:
        if pd.isna(monto_str) or monto_str == '':
            return 0
        
        monto_clean = str(monto_str).strip()
        
        # Remove currency symbols
        monto_clean = re.sub(r'[$€£¥₹₽₩¢]', '', monto_clean)
        monto_clean = re.sub(r'[^\d.,\-]', '', monto_clean)
        
        if not monto_clean:
            return 0
        
        # Handle negative numbers
        es_negativo = monto_clean.startswith('-')
        monto_clean = monto_clean.lstrip('-')
        
        # Handle decimal separators
        if ',' in monto_clean and '.' in monto_clean:
            if monto_clean.rfind(',') > monto_clean.rfind('.'):
                monto_clean = monto_clean.replace('.', '').replace(',', '.')
            else:
                monto_clean = monto_clean.replace(',', '')
        elif ',' in monto_clean:
            if monto_clean.count(',') == 1 and len(monto_clean.split(',')[1]) <= 2:
                monto_clean = monto_clean.replace(',', '.')
            else:
                monto_clean = monto_clean.replace(',', '')
        
        resultado = float(monto_clean)
        return -resultado if es_negativo else resultado
        
    except Exception as e:
        print(f"Error processing amount '{monto_str}': {e}")
        return 0

def normalizar_fecha_flexible(fecha_valor):
    """Normalize dates from multiple formats"""
    try:
        if pd.isna(fecha_valor):
            return datetime.now().isoformat()
        
        fecha_str = str(fecha_valor).strip()
        
        # Try different date formats
        formatos_fecha = [
            '%d-%m-%Y', '%d/%m/%Y', '%d.%m.%Y',
            '%m-%d-%Y', '%m/%d/%Y', 
            '%Y-%m-%d', '%Y/%m/%d',
            '%d-%m-%Y %H:%M:%S', '%d/%m/%Y %H:%M:%S',
        ]
        
        for formato in formatos_fecha:
            try:
                fecha_parsed = datetime.strptime(fecha_str, formato)
                return fecha_parsed.isoformat()
            except ValueError:
                continue
        
        # Try pandas parsing
        try:
            fecha_pandas = pd.to_datetime(fecha_str, dayfirst=True, errors='coerce')
            if not pd.isna(fecha_pandas):
                return fecha_pandas.isoformat()
        except:
            pass
        
        print(f"Could not parse date '{fecha_valor}', using current date")
        return datetime.now().isoformat()
        
    except Exception as e:
        print(f"Error processing date '{fecha_valor}': {e}")
        return datetime.now().isoformat()

def normalizar_medio_pago(medio_pago):
    """Normalize payment methods"""
    if pd.isna(medio_pago):
        return "No especificado"
    
    medio_clean = str(medio_pago).strip().lower()
    
    normalizaciones = {
        'efectivo': 'Efectivo',
        'cash': 'Efectivo',
        'transferencia': 'Transferencia',
        'transfer': 'Transferencia',
        'débito': 'Débito',
        'debito': 'Débito',
        'debit': 'Débito',
        'crédito': 'Crédito',
        'credito': 'Crédito',
        'credit': 'Crédito',
        'tarjeta de credito': 'Crédito',
        'tarjeta de crédito': 'Crédito',
        'mercado pago': 'Mercado Pago',
        'mercadopago': 'Mercado Pago',
        'mp': 'Mercado Pago',
    }
    
    return normalizaciones.get(medio_clean, medio_pago.strip().title())

# Load and process CSV data
def load_csv_data():
    """Load and process the ingresos.csv file"""
    try:
        df = pd.read_csv('ingresos.csv')
        
        # Process the data
        consultas = []
        for index, row in df.iterrows():
            try:
                fecha_iso = normalizar_fecha_flexible(row['Fecha'])
                monto_numerico = extraer_monto_numerico(row['Monto Total'])
                
                if monto_numerico <= 0:
                    continue
                
                consulta = {
                    'id': index + 1,
                    'fecha_consulta': fecha_iso,
                    'monto_ars': round(monto_numerico, 0),
                    'medio_pago': normalizar_medio_pago(row['Medio de Pago']),
                    'estado': 'completada',
                    'paciente': {
                        'nombre': str(row['Paciente']).split()[0] if pd.notna(row['Paciente']) else 'Paciente',
                        'apellido': ' '.join(str(row['Paciente']).split()[1:]) if pd.notna(row['Paciente']) and len(str(row['Paciente']).split()) > 1 else ''
                    },
                    'prestacion_usuario': {
                        'nombre_personalizado': str(row['Tratamiento']) if pd.notna(row['Tratamiento']) else 'Consulta'
                    }
                }
                consultas.append(consulta)
                
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                continue
        
        return consultas
        
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return []

# Load data at startup
CSV_DATA = load_csv_data()
print(f"Loaded {len(CSV_DATA)} consultations from CSV")

# FastAPI app
app = FastAPI(
    title="DentiProject Backend (Real Data)",
    description="Backend using real data from ingresos.csv",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "DentiProject Backend with Real Data is running!", "status": "ok", "consultations_loaded": len(CSV_DATA)}

@app.get("/v1/health")
def health_check():
    return {"status": "ok", "message": "Backend with real data is running", "data_count": len(CSV_DATA)}

@app.post("/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint - accepts admin/Homero123"""
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
def get_resumen():
    """Analytics summary from real data"""
    if not CSV_DATA:
        return {
            "total_consultas": 0,
            "ingreso_total": 0,
            "promedio_consulta": 0,
            "tratamiento_popular": "N/A",
            "ingresos_mes": 0
        }
    
    total_consultas = len(CSV_DATA)
    ingreso_total = sum(c['monto_ars'] for c in CSV_DATA)
    promedio_consulta = ingreso_total / total_consultas if total_consultas > 0 else 0
    
    # Find most popular treatment
    tratamientos = {}
    for consulta in CSV_DATA:
        tratamiento = consulta['prestacion_usuario']['nombre_personalizado']
        tratamientos[tratamiento] = tratamientos.get(tratamiento, 0) + 1
    
    tratamiento_popular = max(tratamientos, key=tratamientos.get) if tratamientos else "N/A"
    
    # Calculate current month income
    fecha_actual = datetime.now()
    ingresos_mes = sum(
        c['monto_ars'] for c in CSV_DATA 
        if datetime.fromisoformat(c['fecha_consulta']).month == fecha_actual.month and
           datetime.fromisoformat(c['fecha_consulta']).year == fecha_actual.year
    )
    
    return {
        "total_consultas": total_consultas,
        "ingreso_total": round(ingreso_total, 0),
        "promedio_consulta": round(promedio_consulta, 0),
        "tratamiento_popular": tratamiento_popular,
        "ingresos_mes": round(ingresos_mes, 0)
    }

@app.get("/v1/analytics/kpis")
def get_kpis():
    """KPI data from real data"""
    if not CSV_DATA:
        return {
            "dias_desde_ultima_consulta": 0,
            "consultas_ultima_semana": 0,
            "ingreso_promedio_diario": 0,
            "crecimiento_mensual": 0
        }
    
    # Sort by date
    consultas_ordenadas = sorted(CSV_DATA, key=lambda x: x['fecha_consulta'], reverse=True)
    
    # Days since last consultation
    ultima_fecha = datetime.fromisoformat(consultas_ordenadas[0]['fecha_consulta'])
    dias_desde_ultima = (datetime.now() - ultima_fecha).days
    
    # Consultations in last week
    hace_una_semana = datetime.now() - timedelta(days=7)
    consultas_ultima_semana = len([
        c for c in CSV_DATA 
        if datetime.fromisoformat(c['fecha_consulta']) >= hace_una_semana
    ])
    
    # Average daily income
    fechas_unicas = set(datetime.fromisoformat(c['fecha_consulta']).date() for c in CSV_DATA)
    ingreso_total = sum(c['monto_ars'] for c in CSV_DATA)
    ingreso_promedio_diario = ingreso_total / len(fechas_unicas) if fechas_unicas else 0
    
    # Monthly growth (simplified)
    fecha_actual = datetime.now()
    mes_actual = fecha_actual.month
    mes_anterior = mes_actual - 1 if mes_actual > 1 else 12
    año_anterior = fecha_actual.year if mes_actual > 1 else fecha_actual.year - 1
    
    ingresos_mes_actual = sum(
        c['monto_ars'] for c in CSV_DATA 
        if datetime.fromisoformat(c['fecha_consulta']).month == mes_actual and
           datetime.fromisoformat(c['fecha_consulta']).year == fecha_actual.year
    )
    
    ingresos_mes_anterior = sum(
        c['monto_ars'] for c in CSV_DATA 
        if datetime.fromisoformat(c['fecha_consulta']).month == mes_anterior and
           datetime.fromisoformat(c['fecha_consulta']).year == año_anterior
    )
    
    crecimiento_mensual = 0
    if ingresos_mes_anterior > 0:
        crecimiento_mensual = ((ingresos_mes_actual - ingresos_mes_anterior) / ingresos_mes_anterior) * 100
    
    return {
        "dias_desde_ultima_consulta": dias_desde_ultima,
        "consultas_ultima_semana": consultas_ultima_semana,
        "ingreso_promedio_diario": round(ingreso_promedio_diario, 0),
        "crecimiento_mensual": round(crecimiento_mensual, 1)
    }

@app.get("/v1/costos/analisis")
def get_costos():
    """Real cost analysis based on equipment and expenses"""
    cost_analysis = calculate_hourly_cost()
    
    # Calculate recommended minimum price (50% margin)
    costo_hora = cost_analysis['costo_hora_ars']
    precio_minimo_recomendado = costo_hora * 1.50  # 50% margin
    
    return {
        "costo_hora_ars": round(costo_hora, 0),
        "costo_equipos_anual": round(cost_analysis['costo_equipos_anual'], 0),
        "costo_gastos_anual": round(cost_analysis['costo_gastos_anual'], 0),
        "costo_total_anual": round(cost_analysis['costo_total_anual'], 0),
        "horas_anuales": cost_analysis['horas_anuales'],
        "precio_minimo_recomendado": round(precio_minimo_recomendado, 0),
        "margen_recomendado": 0.50,
        "cantidad_equipos": cost_analysis['cantidad_equipos'],
        "cantidad_gastos": cost_analysis['cantidad_gastos']
    }

@app.get("/v1/consultas")
def get_consultas(
    limit: int = Query(25), 
    order_by: str = Query("fecha"),
    paciente_q: str = Query(None)
):
    """Get consultations from real data"""
    consultas_filtered = CSV_DATA
    
    # Filter by patient name if provided
    if paciente_q:
        consultas_filtered = [
            c for c in consultas_filtered 
            if paciente_q.lower() in f"{c['paciente']['nombre']} {c['paciente']['apellido']}".lower()
        ]
    
    # Sort data
    if order_by.lower().startswith("fecha"):
        consultas_sorted = sorted(consultas_filtered, key=lambda x: x['fecha_consulta'], reverse="desc" in order_by.lower())
    else:
        consultas_sorted = consultas_filtered
    
    # Apply limit
    return consultas_sorted[:limit]

def calculate_hourly_cost():
    """Calculate real hourly cost based on equipment and fixed expenses"""
    # Configuration parameters (matching app.py defaults)
    config = {
        'tipo_cambio_usd_ars': 1335.0,
        'horas_anuales_trabajadas': 1100
    }
    
    # Get equipment and expenses (using mock data for now)
    equipos = get_equipos()
    gastos = get_gastos()
    
    # 1. Equipment costs (amortization with 4% annual inflation)
    costo_equipos_anual_usd = 0
    for equipo in equipos:
        if equipo.get('activo', True):
            # Amortization with inflation (exact app.py logic)
            costo_reposicion = equipo['monto_compra_usd'] * (1.04 ** equipo['anios_vida_util'])
            amortizacion_anual = costo_reposicion / equipo['anios_vida_util']
            costo_equipos_anual_usd += amortizacion_anual
    
    # Convert USD to ARS
    costo_equipos_anual_ars = costo_equipos_anual_usd * config['tipo_cambio_usd_ars']
    
    # 2. Fixed expenses annual (ARS)
    costo_gastos_anual_ars = sum(
        gasto['monto_mensual_ars'] * 12 
        for gasto in gastos 
        if gasto.get('activo', True)
    )
    
    # 3. Final calculation
    costo_total_anual = costo_equipos_anual_ars + costo_gastos_anual_ars
    horas_anuales = config['horas_anuales_trabajadas']
    
    costo_hora = costo_total_anual / horas_anuales if horas_anuales > 0 else 0
    
    return {
        'costo_hora_ars': costo_hora,
        'costo_equipos_anual': costo_equipos_anual_ars,
        'costo_gastos_anual': costo_gastos_anual_ars,
        'costo_total_anual': costo_total_anual,
        'horas_anuales': horas_anuales,
        'cantidad_equipos': len([e for e in equipos if e.get('activo', True)]),
        'cantidad_gastos': len([g for g in gastos if g.get('activo', True)])
    }

def calculate_recommendations(tiempo_horas: float, costo_materiales_ars: float, usar_costo_real: bool):
    """Shared calculation logic"""
    if usar_costo_real:
        cost_analysis = calculate_hourly_cost()
        costo_hora = cost_analysis['costo_hora_ars']
    else:
        costo_hora = 29000  # Default manual cost
    
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

@app.get("/v1/calculadora/recomendaciones")
def calculadora_get(
    tiempo_horas: float = Query(1.5), 
    costo_materiales_ars: float = Query(5000), 
    usar_costo_real: bool = Query(False)
):
    """Calculator recommendations - GET method"""
    return calculate_recommendations(tiempo_horas, costo_materiales_ars, usar_costo_real)

@app.post("/v1/calculadora/recomendaciones")
def calculadora_post(
    tiempo_horas: float = Query(1.5), 
    costo_materiales_ars: float = Query(5000), 
    usar_costo_real: bool = Query(False)
):
    """Calculator recommendations - POST method for frontend compatibility"""
    return calculate_recommendations(tiempo_horas, costo_materiales_ars, usar_costo_real)

@app.get("/v1/pacientes")
def get_pacientes():
    """Get unique patients from real data"""
    pacientes_unicos = {}
    for consulta in CSV_DATA:
        nombre_completo = f"{consulta['paciente']['nombre']} {consulta['paciente']['apellido']}".strip()
        if nombre_completo not in pacientes_unicos:
            pacientes_unicos[nombre_completo] = {
                "id": len(pacientes_unicos) + 1,
                "nombre": consulta['paciente']['nombre'],
                "apellido": consulta['paciente']['apellido'],
                "email": f"{consulta['paciente']['nombre'].lower()}@email.com",
                "telefono": "+54 11 0000-0000",
                "fecha_nacimiento": "1980-01-01",
                "activo": True
            }
    
    return list(pacientes_unicos.values())

@app.get("/v1/equipos")
def get_equipos():
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
def get_gastos():
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
def get_prestaciones():
    """Get unique treatments from real data"""
    tratamientos_unicos = set()
    for consulta in CSV_DATA:
        tratamientos_unicos.add(consulta['prestacion_usuario']['nombre_personalizado'])
    
    prestaciones = []
    for i, tratamiento in enumerate(sorted(tratamientos_unicos), 1):
        prestaciones.append({
            "id": i,
            "nombre": tratamiento,
            "descripcion": f"Tratamiento de {tratamiento.lower()}",
            "precio_base_ars": 50000,  # Default price
            "activo": True
        })
    
    return prestaciones

@app.get("/v1/prestaciones-usuario")
def get_prestaciones_usuario():
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

# Additional endpoints
@app.get("/v1/consultas/busqueda")
def busqueda_consultas():
    """Consultation search"""
    return get_consultas()

@app.get("/v1/consultas/vista")
def vista_consultas():
    """Consultation view"""
    return get_consultas()

# CRUD endpoints for patients
@app.post("/v1/pacientes")
def create_paciente(paciente_data: dict):
    """Create new patient"""
    new_patient = {
        "id": len([p for p in get_pacientes()]) + 1,
        "nombre": paciente_data.get("nombre", ""),
        "apellido": paciente_data.get("apellido", ""),
        "email": paciente_data.get("email", ""),
        "telefono": paciente_data.get("telefono", ""),
        "fecha_nacimiento": paciente_data.get("fecha_nacimiento", "1980-01-01"),
        "activo": True
    }
    return {"message": "Patient created successfully", "patient": new_patient}

@app.put("/v1/pacientes/{paciente_id}")
def update_paciente(paciente_id: int, paciente_data: dict):
    """Update patient"""
    return {"message": f"Patient {paciente_id} updated successfully", "patient": paciente_data}

@app.delete("/v1/pacientes/{paciente_id}")
def delete_paciente(paciente_id: int):
    """Delete patient"""
    return {"message": f"Patient {paciente_id} deleted successfully"}

# CRUD endpoints for consultations
@app.post("/v1/consultas")
def create_consulta(consulta_data: dict):
    """Create new consultation"""
    global CSV_DATA
    new_consulta = {
        "id": len(CSV_DATA) + 1,
        "fecha_consulta": consulta_data.get("fecha_consulta", datetime.now().isoformat()),
        "monto_ars": consulta_data.get("monto_ars", 0),
        "medio_pago": consulta_data.get("medio_pago", "Efectivo"),
        "estado": "completada",
        "paciente": {
            "nombre": consulta_data.get("paciente_nombre", ""),
            "apellido": consulta_data.get("paciente_apellido", "")
        },
        "prestacion_usuario": {
            "nombre_personalizado": consulta_data.get("tratamiento", "Consulta")
        }
    }
    CSV_DATA.append(new_consulta)
    return {"message": "Consultation created successfully", "consulta": new_consulta}

@app.put("/v1/consultas/{consulta_id}")
def update_consulta(consulta_id: int, consulta_data: dict):
    """Update consultation"""
    global CSV_DATA
    for i, consulta in enumerate(CSV_DATA):
        if consulta["id"] == consulta_id:
            CSV_DATA[i].update({
                "fecha_consulta": consulta_data.get("fecha_consulta", consulta["fecha_consulta"]),
                "monto_ars": consulta_data.get("monto_ars", consulta["monto_ars"]),
                "medio_pago": consulta_data.get("medio_pago", consulta["medio_pago"]),
                "paciente": {
                    "nombre": consulta_data.get("paciente_nombre", consulta["paciente"]["nombre"]),
                    "apellido": consulta_data.get("paciente_apellido", consulta["paciente"]["apellido"])
                },
                "prestacion_usuario": {
                    "nombre_personalizado": consulta_data.get("tratamiento", consulta["prestacion_usuario"]["nombre_personalizado"])
                }
            })
            return {"message": f"Consultation {consulta_id} updated successfully", "consulta": CSV_DATA[i]}
    return {"message": "Consultation not found", "error": True}

@app.delete("/v1/consultas/{consulta_id}")
def delete_consulta(consulta_id: int):
    """Delete consultation"""
    global CSV_DATA
    CSV_DATA = [c for c in CSV_DATA if c["id"] != consulta_id]
    return {"message": f"Consultation {consulta_id} deleted successfully"}

# CRUD endpoints for equipment
@app.post("/v1/equipos")
def create_equipo(equipo_data: dict):
    """Create new equipment"""
    new_equipo = {
        "id": len(get_equipos()) + 1,
        "nombre": equipo_data.get("nombre", ""),
        "monto_compra_usd": equipo_data.get("monto_compra_usd", 0),
        "anios_vida_util": equipo_data.get("anios_vida_util", 5),
        "fecha_compra": equipo_data.get("fecha_compra", datetime.now().strftime("%Y-%m-%d")),
        "observaciones": equipo_data.get("observaciones", ""),
        "activo": True
    }
    return {"message": "Equipment created successfully", "equipo": new_equipo}

@app.put("/v1/equipos/{equipo_id}")
def update_equipo(equipo_id: int, equipo_data: dict):
    """Update equipment"""
    return {"message": f"Equipment {equipo_id} updated successfully", "equipo": equipo_data}

@app.delete("/v1/equipos/{equipo_id}")
def delete_equipo(equipo_id: int):
    """Delete equipment"""
    return {"message": f"Equipment {equipo_id} deleted successfully"}

# CRUD endpoints for expenses
@app.post("/v1/gastos")
def create_gasto(gasto_data: dict):
    """Create new expense"""
    new_gasto = {
        "id": len(get_gastos()) + 1,
        "concepto": gasto_data.get("concepto", ""),
        "monto_mensual_ars": gasto_data.get("monto_mensual_ars", 0),
        "activo": True
    }
    return {"message": "Expense created successfully", "gasto": new_gasto}

@app.put("/v1/gastos/{gasto_id}")
def update_gasto(gasto_id: int, gasto_data: dict):
    """Update expense"""
    return {"message": f"Expense {gasto_id} updated successfully", "gasto": gasto_data}

@app.delete("/v1/gastos/{gasto_id}")
def delete_gasto(gasto_id: int):
    """Delete expense"""
    return {"message": f"Expense {gasto_id} deleted successfully"}

# Configuration endpoints
@app.get("/v1/config")
def get_config():
    """Get current configuration parameters"""
    return {
        "tipo_cambio_usd_ars": 1335.0,
        "horas_anuales_trabajadas": 1100,
        "margen_ganancia": 0.40,
        "costo_por_hora_manual": 29000
    }

@app.put("/v1/config")
def update_config(config_data: dict):
    """Update configuration parameters"""
    # In a real app, this would be saved to database
    # For now, we'll just return success
    return {
        "message": "Configuration updated successfully",
        "config": config_data
    }

@app.post("/v1/import")
async def import_csv(
    file: UploadFile = File(...),
    col_paciente: str = Form(...),
    col_tratamiento: str = Form(...),
    col_monto: str = Form(...),
    col_fecha: str = Form(None),
    col_medio_pago: str = Form(None)
):
    """Import CSV file with comprehensive data normalization"""
    global CSV_DATA
    
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Try different encodings
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        df = None
        encoding_used = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(io.StringIO(contents.decode(encoding)))
                encoding_used = encoding
                break
            except (UnicodeDecodeError, pd.errors.EmptyDataError):
                continue
        
        if df is None:
            return {"error": "Could not read CSV file with any encoding", "migrados": 0, "errores": 0, "total_ars": 0}
        
        # Validate required columns exist
        required_cols = [col_paciente, col_tratamiento, col_monto]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {
                "error": f"Missing required columns: {', '.join(missing_cols)}", 
                "migrados": 0, "errores": 0, "total_ars": 0
            }
        
        # Process and normalize data
        consultas_importadas = []
        errores = 0
        total_ars = 0
        
        for index, row in df.iterrows():
            try:
                # Normalize patient name
                paciente_raw = str(row[col_paciente]).strip() if pd.notna(row[col_paciente]) else ''
                if not paciente_raw:
                    errores += 1
                    continue
                
                # Split patient name properly
                paciente_parts = paciente_raw.split()
                paciente_nombre = paciente_parts[0] if paciente_parts else 'Paciente'
                paciente_apellido = ' '.join(paciente_parts[1:]) if len(paciente_parts) > 1 else ''
                
                # Normalize treatment
                tratamiento_raw = str(row[col_tratamiento]).strip() if pd.notna(row[col_tratamiento]) else 'Consulta'
                tratamiento_normalizado = normalize_treatment_name(tratamiento_raw)
                
                # Normalize amount
                monto_raw = row[col_monto]
                monto_normalizado = extraer_monto_numerico(monto_raw)
                if monto_normalizado <= 0:
                    errores += 1
                    continue
                
                # Normalize date
                if col_fecha and col_fecha in df.columns and pd.notna(row[col_fecha]):
                    fecha_normalizada = normalizar_fecha_flexible(row[col_fecha])
                else:
                    fecha_normalizada = datetime.now().isoformat()
                
                # Normalize payment method
                if col_medio_pago and col_medio_pago in df.columns and pd.notna(row[col_medio_pago]):
                    medio_pago_normalizado = normalizar_medio_pago(row[col_medio_pago])
                else:
                    medio_pago_normalizado = 'Efectivo'
                
                # Create consultation record
                consulta = {
                    'id': len(CSV_DATA) + len(consultas_importadas) + 1,
                    'fecha_consulta': fecha_normalizada,
                    'monto_ars': round(monto_normalizado, 0),
                    'medio_pago': medio_pago_normalizado,
                    'estado': 'completada',
                    'paciente': {
                        'nombre': paciente_nombre,
                        'apellido': paciente_apellido
                    },
                    'prestacion_usuario': {
                        'nombre_personalizado': tratamiento_normalizado
                    }
                }
                
                consultas_importadas.append(consulta)
                total_ars += monto_normalizado
                
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                errores += 1
                continue
        
        # Add imported consultations to global data
        CSV_DATA.extend(consultas_importadas)
        
        return {
            "migrados": len(consultas_importadas),
            "errores": errores,
            "total_ars": round(total_ars, 0),
            "message": f"Successfully imported {len(consultas_importadas)} consultations"
        }
        
    except Exception as e:
        print(f"Import error: {e}")
        return {
            "error": f"Import failed: {str(e)}",
            "migrados": 0,
            "errores": 0,
            "total_ars": 0
        }

def normalize_treatment_name(treatment: str) -> str:
    """Normalize treatment names to standard format"""
    if not treatment or pd.isna(treatment):
        return 'Consulta'
    
    treatment_clean = str(treatment).strip().lower()
    
    # Treatment normalization mapping
    treatment_mapping = {
        # Consultas
        'consulta': 'Consulta',
        'consultation': 'Consulta',
        'visita': 'Consulta',
        'consulta de urgencia': 'Consulta de Urgencia',
        'urgencia': 'Consulta de Urgencia',
        'emergency': 'Consulta de Urgencia',
        
        # Limpiezas
        'limpieza': 'Limpieza',
        'profilaxis': 'Limpieza',
        'cleaning': 'Limpieza',
        'higiene': 'Limpieza',
        
        # Operatorias
        'operatoria': 'Operatoria',
        'operatoria simple': 'Operatoria Simple',
        'operatoria compleja': 'Operatoria Compleja',
        'obturacion': 'Operatoria',
        'empaste': 'Operatoria',
        'filling': 'Operatoria',
        'restauracion': 'Operatoria',
        
        # Endodoncias
        'endodoncia': 'Endodoncia',
        'conducto': 'Endodoncia',
        'root canal': 'Endodoncia',
        'endodoncia unirradicular': 'Endodoncia Unirradicular',
        'endodoncia multirradicular': 'Endodoncia Multirradicular',
        
        # Extracciones
        'extraccion': 'Extracción Simple',
        'extraccion simple': 'Extracción Simple',
        'extraccion compleja': 'Extracción Compleja',
        'extraction': 'Extracción Simple',
        'cirugia': 'Extracción Compleja',
        
        # Coronas
        'corona': 'Corona',
        'crown': 'Corona',
        'corona metalica': 'Corona Metálica',
        'corona de porcelana': 'Corona de Porcelana',
        
        # Blanqueamientos
        'blanqueamiento': 'Blanqueamiento',
        'blanqueamiento ambulatorio': 'Blanqueamiento Ambulatorio',
        'blanqueamiento interno': 'Blanqueamiento Interno',
        'whitening': 'Blanqueamiento',
        
        # Placas
        'placa': 'Placa Estabilizadora Oclusal',
        'placa estabilizadora': 'Placa Estabilizadora Oclusal',
        'placa estabilizadora oclusal': 'Placa Estabilizadora Oclusal',
        'placa de descarga': 'Placa Estabilizadora Oclusal',
        'night guard': 'Placa Estabilizadora Oclusal',
        
        # Prótesis
        'protesis': 'Prótesis',
        'protesis parcial': 'Prótesis Parcial',
        'protesis parcial removible': 'Prótesis Parcial Removible',
        'protesis total': 'Prótesis Total',
        'denture': 'Prótesis',
        
        # Implantes
        'implante': 'Implante',
        'implant': 'Implante',
        
        # Obra social
        'obra social': 'Obra Social',
        'os': 'Obra Social',
        'seguro': 'Obra Social',
        'insurance': 'Obra Social',
        
        # Provisorios
        'provisorio': 'Provisorio',
        'temporal': 'Provisorio',
        'temporary': 'Provisorio'
    }
    
    # Check exact matches first
    if treatment_clean in treatment_mapping:
        return treatment_mapping[treatment_clean]
    
    # Check partial matches
    for key, value in treatment_mapping.items():
        if key in treatment_clean:
            return value
    
    # If no match found, return capitalized original
    return treatment.strip().title()


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting DentiProject Backend with Real Data...")
    print(f"📊 Loaded {len(CSV_DATA)} consultations from ingresos.csv")
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
