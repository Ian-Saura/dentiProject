#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      🚀 DEPLOY TO VPS - Dattaweb Cloud Server           ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

# VPS Configuration
SERVER_USER="root"
SERVER_IP="66.97.44.23"
SERVER_PORT="5661"
SERVER_HOST="vps-5365949-x.dattaweb.com"
APP_DIR="/opt/dentiproject"
APP_USER="denti"

echo -e "${BLUE}Configuración VPS:${NC}"
echo "  Host: ${SERVER_HOST}"
echo "  IP: ${SERVER_IP}"
echo "  Puerto: ${SERVER_PORT}"
echo "  Usuario: ${SERVER_USER}"
echo ""
echo -e "${YELLOW}Nota: Se te pedirá la contraseña varias veces${NC}"
echo ""

# Test SSH connection
echo -e "${BLUE}[0/9] Probando conexión SSH...${NC}"
if ! ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${RED}❌ Error: No se puede conectar vía SSH${NC}"
    echo "Comando de prueba:"
    echo "  ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP}"
    exit 1
fi

echo -e "${GREEN}✓ Conexión SSH exitosa con VPS${NC}"
echo ""

# Paso 1: Copiar archivo
echo -e "${BLUE}[1/9] Copiando archivos al VPS (251KB)...${NC}"
cd ..
scp -P${SERVER_PORT} dentiproject_complete.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}✓ Archivos copiados${NC}"

# Paso 2: Preparar directorio
echo -e "${BLUE}[2/9] Preparando directorio de la aplicación...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Crear directorio si no existe
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
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    echo "✓ Docker instalado"
else
    echo "✓ Docker ya está instalado"
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Instalando Docker Compose plugin..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi
docker compose version
ENDSSH

# Paso 4: Crear archivo .env
echo -e "${BLUE}[4/9] Configurando variables de entorno...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

# Crear .env si no existe
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# PostgreSQL Database
POSTGRES_DB=consultorio_db
POSTGRES_USER=denti_user
POSTGRES_PASSWORD=denti_pass_secure_2024

# Backend
DATABASE_URL=postgresql+asyncpg://denti_user:denti_pass_secure_2024@db:5432/consultorio_db
SYNC_DATABASE_URL=postgresql://denti_user:denti_pass_secure_2024@db:5432/consultorio_db
JWT_SECRET_KEY=super-secret-production-jwt-key-change-this-in-real-deployment-vps-2024
CORS_ORIGINS=http://66.97.44.23,https://vps-5365949-x.dattaweb.com

# Google OAuth - SET YOUR OWN VALUES
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://66.97.44.23:8000/v1/auth/google/callback

# Frontend
VITE_API_URL=http://66.97.44.23:8000
EOF
    echo "✓ Archivo .env creado"
else
    # Actualizar con Google OAuth si no existe
    if ! grep -q "GOOGLE_CLIENT_ID" .env; then
        echo "" >> .env
        echo "# Google OAuth - SET YOUR OWN VALUES" >> .env
        echo "GOOGLE_CLIENT_ID=your-google-client-id-here" >> .env
        echo "GOOGLE_CLIENT_SECRET=your-google-client-secret-here" >> .env
        echo "GOOGLE_REDIRECT_URI=http://66.97.44.23:8000/v1/auth/google/callback" >> .env
        echo "⚠️  Google OAuth placeholders added - UPDATE WITH YOUR CREDENTIALS"
    fi
fi

chown denti:denti .env
ENDSSH

# Paso 5: Iniciar servicios base
echo -e "${BLUE}[5/9] Iniciando base de datos...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Iniciando PostgreSQL..."
sudo -u denti docker compose up -d db
echo "Esperando a que PostgreSQL esté listo..."
sleep 10
sudo -u denti docker compose ps
ENDSSH

# Paso 6: Ejecutar migraciones
echo -e "${BLUE}[6/9] Ejecutando migraciones SQL...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

echo "Migración 1: Auth & Auditoría..."
sudo -u denti docker compose cp backend/migrations/add_auth_and_audit.sql db:/tmp/auth.sql
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/auth.sql 2>&1 | grep -E "(NOTICE|completado|✅)" || echo "Migración ejecutada"

echo ""
echo "Migración 2: RBAC..."
sudo -u denti docker compose cp backend/migrations/add_rbac_system.sql db:/tmp/rbac.sql
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -f /tmp/rbac.sql 2>&1 | grep -E "(NOTICE|completado|✅)" || echo "Migración ejecutada"
ENDSSH

# Paso 7: Build backend
echo -e "${BLUE}[7/9] Building backend (3-5 minutos)...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Building backend..."
sudo -u denti docker compose build backend
echo "✓ Backend built"
ENDSSH

# Paso 8: Build frontend
echo -e "${BLUE}[8/9] Building frontend...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Building frontend..."
sudo -u denti docker compose build frontend
echo "✓ Frontend built"
ENDSSH

# Paso 9: Start all services
echo -e "${BLUE}[9/9] Iniciando todos los servicios...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject
echo "Iniciando todos los servicios..."
sudo -u denti docker compose up -d
echo ""
echo "Esperando servicios (30 segundos)..."
sleep 30
echo ""
echo "Estado de servicios:"
sudo -u denti docker compose ps
ENDSSH

# Verificación
echo ""
echo -e "${BLUE}Verificando deployment...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/dentiproject

echo ""
echo "Roles creados:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT name, display_name FROM roles;" 2>/dev/null | head -10

echo ""
echo "Usuarios con roles:"
sudo -u denti docker compose exec -T db psql -U denti_user -d consultorio_db -c "SELECT u.id, u.username, r.name as role FROM usuarios u LEFT JOIN roles r ON r.id = u.role_id LIMIT 5;" 2>/dev/null | head -10

echo ""
echo "Health check backend:"
sleep 5
curl -s http://localhost:8000/v1/health || echo "Backend aún iniciando..."

echo ""
echo "Logs recientes backend:"
sudo -u denti docker compose logs backend | tail -20
ENDSSH

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║      ✅ DEPLOYMENT COMPLETADO EN VPS                     ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Sistema Deployado en VPS Dattaweb!${NC}"
echo ""
echo -e "${GREEN}🌐 Acceso Público:${NC}"
echo "   Frontend:  http://66.97.44.23"
echo "   Login:     http://66.97.44.23/login"
echo "   Register:  http://66.97.44.23/register"
echo "   Admin:     http://66.97.44.23/admin"
echo "   API Docs:  http://66.97.44.23:8000/v1/docs"
echo ""
echo -e "${GREEN}🔐 Credenciales Admin:${NC}"
echo "   Usuario: admin"
echo "   Password: EfHrx&0P1U3aFb"
echo ""
echo -e "${GREEN}🧪 Próximos pasos:${NC}"
echo "   1. Probar login en navegador"
echo "   2. Crear un usuario nuevo (registro)"
echo "   3. Verificar que tenga rol 'user'"
echo "   4. Como admin, gestionar usuarios en /admin"
echo ""
echo -e "${YELLOW}📝 Nota: Para HTTPS, necesitarás configurar SSL/Let's Encrypt${NC}"
echo ""

