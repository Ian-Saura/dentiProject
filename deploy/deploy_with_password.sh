#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      🚀 DEPLOY COMPLETE SYSTEM - Con SSH Password       ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# Configuration
SERVER_USER="root"
SERVER_IP="192.168.2.108"
SERVER_PORT="22"
APP_DIR="/opt/dentiproject"
APP_USER="denti"

# Pedir contraseña
echo -e "${BLUE}Configuración de conexión SSH:${NC}"
echo "  Usuario: ${SERVER_USER}"
echo "  Servidor: ${SERVER_IP}"
echo "  Puerto: ${SERVER_PORT}"
echo ""
echo -e "${YELLOW}Nota: Necesitarás ingresar la contraseña varias veces durante el proceso${NC}"
echo ""

# Test SSH connection
echo -e "${BLUE}[0/8] Probando conexión SSH...${NC}"
if ! ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${RED}❌ Error: No se puede conectar vía SSH${NC}"
    echo "Verifica:"
    echo "  1. Servidor está encendido"
    echo "  2. Estás en la misma red"
    echo "  3. Contraseña es correcta"
    exit 1
fi

echo -e "${GREEN}✓ Conexión SSH exitosa${NC}"
echo ""

# Continuar con deployment
echo -e "${BLUE}[1/8] Copiando archivos al servidor (251KB)...${NC}"
cd ..
scp -P${SERVER_PORT} dentiproject_complete.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}✓ Archivos copiados${NC}"

echo -e "${BLUE}[2/8] Extrayendo archivos...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
tar xzf /tmp/dentiproject_complete.tar.gz
rm /tmp/dentiproject_complete.tar.gz
chown -R denti:denti /opt/dentiproject
echo "✓ Archivos extraídos"
ENDSSH

echo -e "${BLUE}[3/8] Ejecutando migración: Auth & Auditoría...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/auth.sql
echo "Ejecutando migración de Auth & Auditoría..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/auth.sql | grep -E "(NOTICE|ERROR|✅)" || echo "Migración ejecutada"
ENDSSH

echo -e "${BLUE}[4/8] Ejecutando migración: RBAC...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
sudo -u denti docker compose cp backend/migrations/add_rbac_system.sql db:/tmp/rbac.sql
echo "Ejecutando migración de RBAC..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/rbac.sql | grep -E "(NOTICE|ERROR|✅)" || echo "Migración ejecutada"
ENDSSH

echo -e "${BLUE}[5/8] Actualizando variables de entorno...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
if ! grep -q "GOOGLE_CLIENT_ID" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Google OAuth - SET YOUR OWN VALUES" >> .env
    echo "GOOGLE_CLIENT_ID=your-google-client-id-here" >> .env
    echo "GOOGLE_CLIENT_SECRET=your-google-client-secret-here" >> .env
    echo "GOOGLE_REDIRECT_URI=http://192.168.2.108:8000/v1/auth/google/callback" >> .env
    echo "⚠️  Google OAuth placeholders added - UPDATE WITH YOUR CREDENTIALS"
else
    echo "✓ Google OAuth credentials ya existen"
fi
ENDSSH

echo -e "${BLUE}[6/8] Rebuilding backend (2-3 minutos)...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Rebuilding backend..."
sudo -u denti docker compose build --no-cache backend
echo "✓ Backend rebuilt"
ENDSSH

echo -e "${BLUE}[7/8] Rebuilding frontend...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject/frontend
echo "Instalando dependencias..."
npm install --silent
cd ..
echo "Building frontend..."
sudo -u denti docker compose build frontend
echo "✓ Frontend rebuilt"
ENDSSH

echo -e "${BLUE}[8/8] Restarting servicios...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Stopping services..."
sudo -u denti docker compose down
echo "Starting services..."
sudo -u denti docker compose up -d
echo "Waiting for services..."
sleep 20
echo ""
echo "Estado de servicios:"
sudo -u denti docker compose ps
ENDSSH

echo ""
echo -e "${BLUE}Verificando deployment...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo ""
echo "Roles creados:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT name, display_name FROM roles;" 2>/dev/null || echo "Error consultando roles"
echo ""
echo "Usuarios con roles:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT u.username, r.name as role FROM usuarios u LEFT JOIN roles r ON r.id = u.role_id LIMIT 5;" 2>/dev/null || echo "Error consultando usuarios"
echo ""
echo "Health check:"
curl -s http://localhost:8000/v1/health || echo "Backend iniciando..."
ENDSSH

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE              ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Sistema Completo Deployado!${NC}"
echo ""
echo -e "${GREEN}🌐 Acceso:${NC}"
echo "   Frontend:  http://192.168.2.108"
echo "   Login:     http://192.168.2.108/login"
echo "   Register:  http://192.168.2.108/register"
echo "   Admin:     http://192.168.2.108/admin (solo admin)"
echo "   API Docs:  http://192.168.2.108:8000/v1/docs"
echo ""
echo -e "${GREEN}🧪 Próximos pasos:${NC}"
echo "   1. Probar login: http://192.168.2.108/login"
echo "   2. Probar registro: http://192.168.2.108/register"
echo "   3. Como admin, ir a: http://192.168.2.108/admin"
echo "   4. Verificar Google Sign-In funcione"
echo ""

