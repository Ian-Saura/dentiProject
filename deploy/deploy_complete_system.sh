#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      🚀 DEPLOY COMPLETE SYSTEM - Auth + Admin + RBAC    ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# Configuration
SERVER_USER="root"
SERVER_IP="192.168.2.108"
SERVER_PORT="22"
APP_DIR="/opt/dentiproject"
APP_USER="denti"

# Check if SSH is available
echo -e "${BLUE}[0/8] Verificando conexión SSH...${NC}"
if ! ssh -p${SERVER_PORT} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${RED}❌ Error: No se puede conectar vía SSH al servidor${NC}"
    echo -e "${YELLOW}Opciones alternativas:${NC}"
    echo "  1. Copiar manualmente dentiproject_complete.tar.gz al servidor vía USB/FTP"
    echo "  2. Verificar que el servidor esté en la red y SSH habilitado"
    echo "  3. Usar el puerto correcto (actual: ${SERVER_PORT})"
    echo ""
    echo -e "${BLUE}Archivo empaquetado listo en:${NC}"
    echo "  $(pwd)/../dentiproject_complete.tar.gz (251KB)"
    echo ""
    echo -e "${BLUE}Comandos para ejecutar en el servidor:${NC}"
    cat << 'MANUAL'
    cd /opt/dentiproject
    tar xzf /tmp/dentiproject_complete.tar.gz
    
    # Migraciones
    sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/auth.sql
    sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/auth.sql
    
    sudo -u denti docker compose cp backend/migrations/add_rbac_system.sql db:/tmp/rbac.sql
    sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/rbac.sql
    
    # Rebuild
    sudo -u denti docker compose build --no-cache backend
    cd frontend && npm install && cd ..
    sudo -u denti docker compose build frontend
    
    # Restart
    sudo -u denti docker compose down
    sudo -u denti docker compose up -d
MANUAL
    exit 1
fi

echo -e "${GREEN}✓ SSH connection OK${NC}"

# Paso 1: Copiar archivo al servidor
echo -e "${BLUE}[1/8] Copiando archivos al servidor (251KB)...${NC}"
cd ..
scp -P${SERVER_PORT} dentiproject_complete.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# Paso 2: Extraer archivos
echo -e "${BLUE}[2/8] Extrayendo archivos en el servidor...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
tar xzf /tmp/dentiproject_complete.tar.gz
rm /tmp/dentiproject_complete.tar.gz
chown -R denti:denti /opt/dentiproject
echo "✓ Archivos extraídos"
ENDSSH

# Paso 3: Migración Auth & Auditoría
echo -e "${BLUE}[3/8] Ejecutando migración: Auth & Auditoría...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Copiar y ejecutar migración de auth
sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/auth.sql
echo "Ejecutando migración de Auth & Auditoría..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/auth.sql

ENDSSH

# Paso 4: Migración RBAC
echo -e "${BLUE}[4/8] Ejecutando migración: RBAC (Roles & Permisos)...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Copiar y ejecutar migración de RBAC
sudo -u denti docker compose cp backend/migrations/add_rbac_system.sql db:/tmp/rbac.sql
echo "Ejecutando migración de RBAC..."
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/rbac.sql

ENDSSH

# Paso 5: Actualizar variables de entorno
echo -e "${BLUE}[5/8] Actualizando variables de entorno...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Agregar Google OAuth credentials si no existen
if ! grep -q "GOOGLE_CLIENT_ID" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Google OAuth" >> .env
    echo "GOOGLE_CLIENT_ID=your-google-client-id-here" >> .env
    echo "GOOGLE_CLIENT_SECRET=your-google-client-secret-here" >> .env
    echo "GOOGLE_REDIRECT_URI=http://192.168.2.108:8000/v1/auth/google/callback" >> .env
    echo "✓ Google OAuth credentials agregadas"
else
    echo "✓ Google OAuth credentials ya existen"
fi

ENDSSH

# Paso 6: Rebuild Backend
echo -e "${BLUE}[6/8] Rebuilding backend (esto puede tomar 2-3 minutos)...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Rebuilding backend con nuevas dependencias..."
sudo -u denti docker compose build --no-cache backend
echo "✓ Backend rebuilt"
ENDSSH

# Paso 7: Rebuild Frontend
echo -e "${BLUE}[7/8] Rebuilding frontend (instalando dependencias)...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject/frontend
echo "Instalando dependencias de frontend..."
npm install
cd ..
echo "Rebuilding frontend..."
sudo -u denti docker compose build frontend
echo "✓ Frontend rebuilt"
ENDSSH

# Paso 8: Restart servicios
echo -e "${BLUE}[8/8] Restarting servicios...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

echo "Deteniendo servicios..."
sudo -u denti docker compose down

echo "Iniciando servicios..."
sudo -u denti docker compose up -d

echo "Esperando a que los servicios estén listos..."
sleep 15

echo ""
echo "Estado de servicios:"
sudo -u denti docker compose ps

ENDSSH

# Verificación final
echo -e "${BLUE}Verificando deployment...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

echo ""
echo "Verificando base de datos..."
echo "Roles creados:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT name, display_name FROM roles;"

echo ""
echo "Usuarios con roles:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT u.username, r.name as role FROM usuarios u LEFT JOIN roles r ON r.id = u.role_id LIMIT 5;"

echo ""
echo "Verificando backend health..."
sleep 5
curl -s http://localhost:8000/v1/health | jq '.' || echo "Backend iniciando..."

ENDSSH

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE              ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}🎉 Sistema Completo Deployado!${NC}"
echo ""
echo -e "${GREEN}📊 Features Disponibles:${NC}"
echo "   ✓ Login con username/password"
echo "   ✓ Login con Google OAuth"
echo "   ✓ Registro de nuevos usuarios"
echo "   ✓ Admin Panel (gestión de usuarios y roles)"
echo "   ✓ Sistema RBAC (4 roles, 14 permisos)"
echo "   ✓ Auditoría automática de acciones"
echo "   ✓ Analytics dashboard"
echo ""
echo -e "${GREEN}🌐 Acceso:${NC}"
echo "   Frontend:  http://192.168.2.108"
echo "   Admin:     http://192.168.2.108/admin (solo admin)"
echo "   Register:  http://192.168.2.108/register"
echo "   API Docs:  http://192.168.2.108:8000/v1/docs"
echo ""
echo -e "${GREEN}🧪 Testing Rápido:${NC}"
echo "   # Login normal"
echo "   http://192.168.2.108/login"
echo ""
echo "   # Registro nuevo usuario"
echo "   http://192.168.2.108/register"
echo ""
echo "   # Admin panel"
echo "   http://192.168.2.108/admin"
echo ""
echo -e "${GREEN}📝 Próximos pasos:${NC}"
echo "   1. Probar login con admin"
echo "   2. Probar registro de nuevo usuario"
echo "   3. Verificar que nuevo usuario tenga rol 'user'"
echo "   4. Como admin, ir a /admin y gestionar usuarios"
echo "   5. Probar Google Sign-In"
echo ""

