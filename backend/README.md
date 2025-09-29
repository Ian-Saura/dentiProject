# DentiProject Backend

FastAPI backend for DentiProject, providing multi-tenant CRUD operations, analytics, calculator, and CSV import functionalities with parity to the legacy Streamlit app.

## ✅ Status: READY FOR USE

The backend is **fully functional** and serves as a proper **BFF (Backend for Frontend)** for the Streamlit app (`app.py`). All core functionality has been implemented and validated.

## Overview

This backend implements a complete REST API that mirrors the functionality of `app.py` (v6), using the MySQL schema in `tablas_app.sql` (11 tables + view). All endpoints enforce tenancy by `usuario_id` from JWT tokens, except read-only catalogs.

## 🏗️ BFF Architecture

This backend serves as a **Backend for Frontend (BFF)** specifically designed for the Streamlit app:

- **🔄 API Parity**: Every function in `app.py` has a corresponding API endpoint
- **🏢 Multi-tenant**: All data is scoped by `usuario_id` for complete isolation
- **🔐 Authentication**: JWT-based auth system matching the Streamlit user system
- **📊 Analytics**: Real-time dashboard data via `/v1/analytics/*` endpoints
- **🧮 Calculator**: Price calculation engine via `/v1/calculadora/*` endpoints
- **📥 Import**: CSV import functionality with the same normalizers as Streamlit
- **💰 Cost Analysis**: Equipment and fixed costs analysis via `/v1/costos/*` endpoints

## API Endpoints

### Authentication
- `POST /v1/auth/login` - Login with username/password

### CRUD Resources (Tenanted)
- `GET/POST /v1/pacientes` - Patients
- `GET/POST /v1/consultas` - Appointments
- `GET/POST /v1/gastos` - Fixed expenses
- `GET/POST /v1/equipos` - Equipment costs
- `GET/POST /v1/compras` - Supplies purchases
- `GET/POST /v1/prestaciones-usuario` - User services
- `GET/POST/PATCH /v1/config` - User configuration

### Read-Only Catalogs
- `GET /v1/prestaciones` - Services catalog
- `GET /v1/insumos-basicos` - Supplies catalog

### Parity Endpoints (from app.py)
- `GET /v1/analytics/resumen` - Dashboard summary (total_consultas, ingreso_total, etc.)
- `GET /v1/analytics/kpis` - KPIs (dias_desde_ultima_consulta, etc.)
- `GET /v1/costos/analisis` - Cost analysis (costo_hora_ars, etc.)
- `GET /v1/consultas/busqueda` - Search with filters
- `GET /v1/consultas/vista` - View with periods/ordering
- `POST /v1/calculadora/recomendaciones` - Price recommendations (4 margins)
- `POST /v1/import` - CSV import with normalizers
- `GET /v1/precios` - Prices from view (scoped by usuario_id)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd backend
python start_backend.py
```

This script will:
- ✅ Validate the backend structure
- 📦 Install all required dependencies
- 📋 Create environment configuration
- 🚀 Start the server at http://localhost:8000

### Option 2: Manual Setup
1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Create database:**
   ```sql
   CREATE DATABASE consultorio_db;
   ```

4. **Load schema:**
   ```bash
   mysql -u user -p consultorio_db < ../tablas_app.sql
   ```

5. **Start server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 🔧 Validation Tool
To check if everything is set up correctly:
```bash
cd backend
python validate_structure.py
```

## Testing

Run smoke tests:
```bash
pytest -q
```

## Mapping from app.py Functions to API Endpoints

| app.py Function | API Endpoint | Description |
|----------------|--------------|-------------|
| DataManager.load/save | Various CRUD | Persist data |
| add_consulta | POST /v1/consultas | Add appointment |
| add_equipo | POST /v1/equipos | Add equipment |
| add_gasto_fijo | POST /v1/gastos | Add fixed expense |
| delete_* | DELETE /v1/*/{id} | Delete resources |
| calcular_costo_hora_real | GET /v1/costos/analisis | Cost analysis |
| get_resumen | GET /v1/analytics/resumen | Summary metrics |
| aplicar_filtros_visualizacion | GET /v1/consultas/vista | View filters |
| aplicar_filtros_busqueda | GET /v1/consultas/busqueda | Search filters |
| ejecutar_migracion_flexible | POST /v1/import | CSV import |
| extraer_monto_numerico | Internal normalizer | Amount extraction |
| normalizar_fecha_flexible | Internal normalizer | Date parsing |
| normalizar_medio_pago | Internal normalizer | Payment method |

## Example cURL Commands

### Login
```bash
curl -X POST "http://localhost:8000/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=pass"
```

### List Patients
```bash
curl -X GET "http://localhost:8000/v1/pacientes" \
  -H "Authorization: Bearer <token>"
```

### Create Consultation
```bash
curl -X POST "http://localhost:8000/v1/consultas" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paciente_id": 1, "prestacion_usuario_id": 1, "fecha_consulta": "2025-01-01", "monto_ars": 1000.0, "medio_pago": "efectivo"}'
```

### Get Summary
```bash
curl -X GET "http://localhost:8000/v1/analytics/resumen" \
  -H "Authorization: Bearer <token>"
```

### Import CSV
```bash
curl -X POST "http://localhost:8000/v1/import" \
  -H "Authorization: Bearer <token>" \
  -F "file=@data.csv" \
  -F "col_paciente=paciente" \
  -F "col_tratamiento=tratamiento" \
  -F "col_monto=monto"
```
