#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      🚀 DEPLOY AUTH & ANALYTICS UPGRADE                 ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# Configuration
SERVER_USER="root"
SERVER_IP="192.168.2.108"
SERVER_PORT="22"
APP_DIR="/opt/dentiproject"
APP_USER="denti"

# Paso 1: Copiar archivos al servidor
echo -e "${BLUE}[1/6] Copiando archivos al servidor...${NC}"
cd ..
tar czf /tmp/dentiproject_auth_upgrade.tar.gz \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='mi_entorno' \
    --exclude='venv_production' \
    --exclude='uploads' \
    --exclude='.env' \
    backend/ frontend/ docker-compose.yml Dockerfile.backend

scp -P${SERVER_PORT} /tmp/dentiproject_auth_upgrade.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
rm /tmp/dentiproject_auth_upgrade.tar.gz

# Paso 2: Extraer archivos en el servidor
echo -e "${BLUE}[2/6] Extrayendo archivos...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
tar xzf /tmp/dentiproject_auth_upgrade.tar.gz
rm /tmp/dentiproject_auth_upgrade.tar.gz
chown -R denti:denti /opt/dentiproject
ENDSSH

# Paso 3: Ejecutar migración de base de datos
echo -e "${BLUE}[3/6] Ejecutando migración de base de datos...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Copiar script de migración al contenedor
sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/migration.sql

# Ejecutar migración
echo "Ejecutando migración SQL..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/migration.sql

# Verificar tablas
echo "Verificando tablas creadas..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "\d usuarios" | head -20
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "\d auditoria" | head -20

ENDSSH

# Paso 4: Actualizar variables de entorno
echo -e "${BLUE}[4/6] Actualizando variables de entorno...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Agregar Google OAuth credentials si no existen
if ! grep -q "GOOGLE_CLIENT_ID" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Google OAuth - SET YOUR OWN VALUES" >> .env
    echo "GOOGLE_CLIENT_ID=your-google-client-id-here" >> .env
    echo "GOOGLE_CLIENT_SECRET=your-google-client-secret-here" >> .env
    echo "GOOGLE_REDIRECT_URI=http://192.168.2.108:8000/v1/auth/google/callback" >> .env
    echo "⚠️  Google OAuth placeholders added - UPDATE WITH YOUR CREDENTIALS"
fi

ENDSSH

# Paso 5: Rebuild y restart servicios
echo -e "${BLUE}[5/6] Rebuilding y restarting servicios...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Rebuild backend (con cache bust)
echo "Rebuilding backend..."
sudo -u denti docker compose build --no-cache backend

# Rebuild frontend
echo "Rebuilding frontend..."
cd frontend
npm install
cd ..
sudo -u denti docker compose build frontend

# Restart todos los servicios
echo "Restarting services..."
sudo -u denti docker compose down
sudo -u denti docker compose up -d

echo "Waiting for services to start..."
sleep 15

ENDSSH

# Paso 6: Verificar deployment
echo -e "${BLUE}[6/6] Verificando deployment...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

echo "Estado de servicios:"
sudo -u denti docker compose ps

echo ""
echo "Verificando auditoría..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT COUNT(*) as total_audits FROM auditoria;"

echo ""
echo "Verificando backend health..."
sleep 5
curl -s http://localhost:8000/v1/health | jq '.' || echo "Waiting for backend..."

echo ""
echo "Endpoints disponibles:"
echo "  - http://192.168.2.108:8000/v1/docs (API Documentation)"
echo "  - http://192.168.2.108:8000/v1/auth/register (Registration)"
echo "  - http://192.168.2.108:8000/v1/auth/google (Google OAuth)"
echo "  - http://192.168.2.108:8000/v1/analytics/summary (Analytics)"

ENDSSH

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      ✅ DEPLOYMENT COMPLETED SUCCESSFULLY               ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

echo -e "${GREEN}🎉 Auth & Analytics System Deployed!${NC}"
echo ""
echo -e "${GREEN}📊 New Features:${NC}"
echo "   ✓ User Registration"
echo "   ✓ Google OAuth Login"
echo "   ✓ Comprehensive Audit System"
echo "   ✓ Analytics Dashboard"
echo "   ✓ User Activity Tracking"
echo ""
echo -e "${GREEN}🌐 Access:${NC}"
echo "   Frontend: http://192.168.2.108"
echo "   API Docs: http://192.168.2.108:8000/v1/docs"
echo ""
echo -e "${GREEN}🧪 Test Registration:${NC}"
echo '   curl -X POST http://192.168.2.108:8000/v1/auth/register \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"username":"testuser","email":"test@example.com","password":"Test1234","nombre":"Test","especialidad":"odontologia"}'"'"
echo ""

