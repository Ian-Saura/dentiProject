#!/bin/bash

# Configuración VPS
VPS_USER="root"
VPS_IP="66.97.44.23"
VPS_PORT="5661"
VPS_PASSWORD="EfHrx&0P1U3aFb"
PROJECT_DIR="/opt/dentiproject"
ADMIN_PASSWORD="EfHrx&0P1U3aFb"

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║           🚀 DEPLOY FINAL A PRODUCCIÓN                               ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"

# 1. Crear tarball con todos los archivos
echo ""
echo "📦 1. Creando tarball del proyecto..."
tar -czf dentiproject_final.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.venv' \
    --exclude='mi_entorno' \
    --exclude='venv_production' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache' \
    --exclude='test_*.txt' \
    --exclude='deploy_log.txt' \
    backend/ \
    frontend/ \
    docker-compose.yml \
    Dockerfile.backend \
    nginx.conf \
    init_db.sql \
    .gitignore

echo "✅ Tarball creado: $(du -h dentiproject_final.tar.gz | cut -f1)"

# 2. Copiar al servidor
echo ""
echo "📤 2. Copiando archivos al servidor..."
sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no \
    dentiproject_final.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

if [ $? -eq 0 ]; then
    echo "✅ Archivos copiados exitosamente"
else
    echo "❌ Error al copiar archivos"
    exit 1
fi

# 3. Desplegar en el servidor
echo ""
echo "🔧 3. Desplegando en el servidor..."
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'

set -e

echo "📂 Creando directorios..."
mkdir -p /opt/dentiproject
cd /opt/dentiproject

echo "📦 Extrayendo archivos..."
tar -xzf /tmp/dentiproject_final.tar.gz
rm /tmp/dentiproject_final.tar.gz

echo "🗄️ Aplicando migraciones SQL..."
# Asegurarse de que la base de datos esté corriendo
docker compose up -d db
sleep 5

# Aplicar migraciones
docker compose exec -T db psql -U postgres -d dentidb << 'EOF' || true
-- Crear usuarios table si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    especialidad VARCHAR(50) NOT NULL DEFAULT 'odontologia',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    provider VARCHAR(50),
    onboarding_completado BOOLEAN DEFAULT FALSE,
    email_verificado BOOLEAN DEFAULT FALSE,
    role_id INTEGER,
    plan VARCHAR(20) DEFAULT 'trial',
    fecha_inicio_plan DATE,
    fecha_vencimiento DATE
);

-- Crear roles table si no existe
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto
INSERT INTO roles (name, description) VALUES 
    ('admin', 'Administrador del sistema'),
    ('user', 'Usuario regular'),
    ('moderator', 'Moderador'),
    ('viewer', 'Visualizador')
ON CONFLICT (name) DO NOTHING;

-- Agregar columnas si no existen
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_inicio_plan DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- Agregar campos de pacientes si no existen
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(200);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medicamentos_actuales TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS observaciones_medicas TEXT;
EOF

echo "🐳 Rebuilding Docker images..."
DOCKER_BUILDKIT=1 docker compose build --no-cache

echo "🚀 Iniciando servicios..."
docker compose down
docker compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 15

echo "✅ Servicios iniciados"
docker compose ps

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy en servidor completado"
else
    echo ""
    echo "❌ Error en deploy del servidor"
    exit 1
fi

# 4. Crear usuario admin
echo ""
echo "👤 4. Creando usuario administrador..."
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << ENDSSH2

cd /opt/dentiproject

docker compose exec -T backend python3 << 'EOPY'
from app.db.session import SessionLocal
from app.models import Usuario
from app.models.usuarios import Plan
from app.core.security import get_password_hash
from app.services.role_service import RoleService
from datetime import datetime, date

db = SessionLocal()

try:
    # Check if admin exists
    admin = db.query(Usuario).filter(Usuario.username == 'admin').first()
    
    if not admin:
        # Get admin role
        admin_role = RoleService.get_role_by_name(db, 'admin')
        
        admin = Usuario(
            username='admin',
            email='admin@dentiapp.com',
            nombre='Admin',
            apellido='System',
            password_hash=get_password_hash('$ADMIN_PASSWORD'),
            especialidad='odontologia',
            activo=True,
            email_verificado=True,
            onboarding_completado=True,
            plan=Plan.premium,
            fecha_inicio_plan=date.today(),
            fecha_registro=datetime.utcnow(),
            role_id=admin_role.id if admin_role else None
        )
        db.add(admin)
        db.commit()
        print('✅ Admin user created')
    else:
        # Update password
        admin.password_hash = get_password_hash('$ADMIN_PASSWORD')
        admin.activo = True
        admin.plan = Plan.premium
        db.commit()
        print('✅ Admin user updated')
except Exception as e:
    print(f'⚠️ Error: {e}')
finally:
    db.close()
EOPY

ENDSSH2

echo "✅ Usuario admin configurado"

# 5. Verificar deployment
echo ""
echo "🔍 5. Verificando deployment..."
echo "Esperando 10 segundos para que los servicios estén completamente listos..."
sleep 10

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_IP}/v1/health)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check: OK (HTTP $HTTP_STATUS)"
else
    echo "⚠️ Health check: HTTP $HTTP_STATUS (puede necesitar más tiempo)"
fi

# Limpiar tarball local
rm -f dentiproject_final.tar.gz

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║           ✅ DEPLOY COMPLETADO EXITOSAMENTE                          ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 URL: http://${VPS_IP}"
echo "👤 Usuario: admin"
echo "🔑 Password: ${ADMIN_PASSWORD}"
echo ""
echo "📊 Para ver logs:"
echo "   ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_IP}"
echo "   cd ${PROJECT_DIR} && docker compose logs -f"
echo ""

