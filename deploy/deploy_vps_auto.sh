#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      🚀 DEPLOY TO VPS - Automated with Password         ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# VPS Configuration
SERVER_USER="root"
SERVER_IP="66.97.44.23"
SERVER_PORT="5661"
SERVER_PASS="EfHrx&0P1U3aFb"
APP_DIR="/opt/dentiproject"

# Helper functions
ssh_cmd() {
    sshpass -p "${SERVER_PASS}" ssh -p${SERVER_PORT} -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$@"
}

scp_cmd() {
    sshpass -p "${SERVER_PASS}" scp -P${SERVER_PORT} -o StrictHostKeyChecking=no "$@"
}

echo -e "${BLUE}Configuración VPS:${NC}"
echo "  IP: ${SERVER_IP}"
echo "  Puerto: ${SERVER_PORT}"
echo "  Usuario: ${SERVER_USER}"
echo ""

# Test SSH connection
echo -e "${BLUE}[0/9] Probando conexión SSH...${NC}"
if ! ssh_cmd "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar vía SSH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Conexión SSH exitosa${NC}"

# Paso 1: Copiar archivo
echo -e "${BLUE}[1/9] Copiando archivos al VPS (251KB)...${NC}"
cd ..
if ! scp_cmd dentiproject_complete.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/; then
    echo -e "${RED}❌ Error copiando archivos${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Archivos copiados${NC}"

# Paso 2: Preparar directorio
echo -e "${BLUE}[2/9] Preparando directorio...${NC}"
ssh_cmd bash << 'ENDSSH'
mkdir -p /opt/dentiproject
cd /opt/dentiproject

# Crear usuario denti si no existe
if ! id "denti" &>/dev/null; then
    useradd -r -s /bin/bash denti
    echo "✓ Usuario denti creado"
fi

# Extraer archivos
tar xzf /tmp/dentiproject_complete.tar.gz
rm /tmp/dentiproject_complete.tar.gz
chown -R denti:denti /opt/dentiproject
echo "✓ Archivos extraídos"
ENDSSH

# Paso 3: Verificar Docker
echo -e "${BLUE}[3/9] Verificando Docker...${NC}"
ssh_cmd bash << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    echo "✓ Docker instalado"
else
    echo "✓ Docker ya instalado"
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Instalando Docker Compose..."
    apt-get update -qq
    apt-get install -y docker-compose-plugin
fi
docker compose version
ENDSSH

# Paso 4: Configurar .env
echo -e "${BLUE}[4/9] Configurando variables de entorno...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject

cat > .env << 'EOF'
# PostgreSQL Database
POSTGRES_DB=consultorio_db
POSTGRES_USER=denti_user
POSTGRES_PASSWORD=denti_pass_secure_2024

# Backend
DATABASE_URL=postgresql+asyncpg://denti_user:denti_pass_secure_2024@db:5432/consultorio_db
SYNC_DATABASE_URL=postgresql://denti_user:denti_pass_secure_2024@db:5432/consultorio_db
JWT_SECRET_KEY=super-secret-production-jwt-key-change-this-in-real-deployment-vps-2024
CORS_ORIGINS=http://66.97.44.23,http://vps-5365949-x.dattaweb.com

# Google OAuth - SET YOUR OWN VALUES
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://66.97.44.23:8000/v1/auth/google/callback

# Frontend
VITE_API_URL=http://66.97.44.23:8000
EOF

chown denti:denti .env
echo "✓ .env creado"
ENDSSH

# Paso 5: Iniciar DB
echo -e "${BLUE}[5/9] Iniciando PostgreSQL...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject
sudo -u denti docker compose up -d db
sleep 15
sudo -u denti docker compose ps | grep db
ENDSSH

# Paso 6: Migraciones
echo -e "${BLUE}[6/9] Ejecutando migraciones SQL...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject

echo "Migración 1: Auth & Auditoría..."
sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/auth.sql
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/auth.sql 2>&1 | grep -v "^$" | tail -5

echo ""
echo "Migración 2: RBAC..."
sudo -u denti docker compose cp backend/migrations/add_rbac_system.sql db:/tmp/rbac.sql
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/rbac.sql 2>&1 | grep -v "^$" | tail -5
ENDSSH

# Paso 7: Build backend
echo -e "${BLUE}[7/9] Building backend (esto toma 3-5 minutos)...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject
echo "Building backend..."
sudo -u denti docker compose build backend 2>&1 | grep -E "(Step|Building|Successfully|FINISHED)"
echo "✓ Backend built"
ENDSSH

# Paso 8: Build frontend
echo -e "${BLUE}[8/9] Building frontend (esto toma 2-3 minutos)...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject
echo "Building frontend..."
sudo -u denti docker compose build frontend 2>&1 | grep -E "(Step|Building|Successfully|FINISHED)"
echo "✓ Frontend built"
ENDSSH

# Paso 9: Start all
echo -e "${BLUE}[9/9] Iniciando todos los servicios...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject
echo "Iniciando servicios..."
sudo -u denti docker compose up -d
sleep 30
echo ""
echo "Estado de servicios:"
sudo -u denti docker compose ps
ENDSSH

# Verificación final
echo ""
echo -e "${BLUE}Verificando deployment...${NC}"
ssh_cmd bash << 'ENDSSH'
cd /opt/dentiproject

echo ""
echo "=== Verificación de Base de Datos ==="
echo "Roles creados:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT name, display_name FROM roles;" 2>/dev/null | head -10

echo ""
echo "Usuarios con roles:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT u.id, u.username, u.email, r.name as role FROM usuarios u LEFT JOIN roles r ON r.id = u.role_id;" 2>/dev/null | head -10

echo ""
echo "=== Health Check Backend ==="
sleep 5
curl -s http://localhost:8000/v1/health | head -20

echo ""
echo "=== Logs Backend (últimas 15 líneas) ==="
sudo -u denti docker compose logs backend | tail -15
ENDSSH

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      ✅ DEPLOYMENT COMPLETADO EN VPS DATTAWEB            ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Sistema Deployado Exitosamente!${NC}"
echo ""
echo -e "${GREEN}🌐 URLs de Acceso:${NC}"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Frontend:   http://66.97.44.23"
echo "   Login:      http://66.97.44.23/login"
echo "   Register:   http://66.97.44.23/register"
echo "   Admin:      http://66.97.44.23/admin"
echo "   API Docs:   http://66.97.44.23:8000/v1/docs"
echo "   Health:     http://66.97.44.23:8000/v1/health"
echo ""
echo -e "${GREEN}🔐 Credenciales Admin:${NC}"
echo "   Usuario: admin"
echo "   Password: EfHrx&0P1U3aFb"
echo ""
echo -e "${GREEN}✅ Features Implementadas:${NC}"
echo "   ✓ Login con username/password"
echo "   ✓ Google OAuth 2.0"
echo "   ✓ Registro de usuarios"
echo "   ✓ Sistema RBAC (4 roles)"
echo "   ✓ Admin Panel completo"
echo "   ✓ Gestión de usuarios y roles"
echo "   ✓ Auditoría automática"
echo "   ✓ Analytics dashboard"
echo ""
echo -e "${YELLOW}🧪 Pasos de Testing:${NC}"
echo "   1. Abrir http://66.97.44.23/login"
echo "   2. Login como admin"
echo "   3. Verificar que aparece 'Admin Panel' en menú"
echo "   4. Crear un usuario nuevo (Register)"
echo "   5. Como admin, ir a /admin y gestionar usuarios"
echo "   6. Probar Google Sign-In"
echo ""
echo -e "${YELLOW}📊 Comandos Útiles:${NC}"
echo "   Ver logs:      ssh -p5661 root@66.97.44.23 'cd /opt/dentiproject && sudo -u denti docker compose logs -f backend'"
echo "   Restart:       ssh -p5661 root@66.97.44.23 'cd /opt/dentiproject && sudo -u denti docker compose restart'"
echo "   Status:        ssh -p5661 root@66.97.44.23 'cd /opt/dentiproject && sudo -u denti docker compose ps'"
echo ""

