#!/bin/bash

# Script de despliegue de la aplicación DentiProject
# Uso: ./deploy_app.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Despliegue DentiProject ===${NC}\n"

# Configuración
PROJECT_NAME="dentiproject"
APP_USER="dentiapp"
APP_DIR="/opt/${PROJECT_NAME}"
REPO_URL="<TU_REPO_GIT_URL>"  # Cambiar por tu URL de repositorio

# Verificar que estamos en el directorio correcto
if [ ! -f "../docker-compose.yml" ]; then
    echo -e "${RED}Error: Ejecuta este script desde el directorio deploy/${NC}"
    exit 1
fi

echo -e "${YELLOW}Este script desplegará la aplicación en el servidor${NC}\n"

# Paso 1: Crear directorio .env en el servidor
echo -e "${GREEN}[1/6] Configurando variables de entorno...${NC}"
read -p "¿Quieres configurar las variables de entorno ahora? (s/n): " configure_env

if [ "$configure_env" = "s" ] || [ "$configure_env" = "S" ]; then
    echo -e "${BLUE}Ingresa los siguientes datos:${NC}"
    
    read -p "Database Name (default: consultorio_db): " DB_NAME
    DB_NAME=${DB_NAME:-consultorio_db}
    
    read -p "Database User (default: denti_user): " DB_USER
    DB_USER=${DB_USER:-denti_user}
    
    read -sp "Database Password (default: denti_pass): " DB_PASSWORD
    echo
    DB_PASSWORD=${DB_PASSWORD:-denti_pass}
    
    read -sp "JWT Secret Key (presiona Enter para generar automática): " JWT_SECRET
    echo
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        echo -e "${GREEN}JWT Secret key generada automáticamente${NC}"
    fi
    
    # Crear archivo .env temporal
    cat > /tmp/dentiproject.env << EOF
# PostgreSQL Database
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}

# Backend
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
JWT_SECRET_KEY=${JWT_SECRET}
CORS_ORIGINS=http://localhost:3000,http://localhost

# Frontend
VITE_API_URL=http://localhost:8000
EOF

    # Copiar al servidor
    scp /tmp/dentiproject.env dentiproject:/tmp/app.env
    ssh dentiproject "sudo mv /tmp/app.env ${APP_DIR}/.env && sudo chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env"
    rm /tmp/dentiproject.env
    
    echo -e "${GREEN}Variables de entorno configuradas${NC}"
else
    echo -e "${YELLOW}Recuerda configurar el archivo .env en el servidor manualmente${NC}"
fi

# Paso 2: Copiar archivos al servidor
echo -e "${GREEN}[2/6] Copiando archivos al servidor...${NC}"
cd ..
tar czf /tmp/dentiproject.tar.gz \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='mi_entorno' \
    --exclude='venv_production' \
    --exclude='uploads' \
    --exclude='.env' \
    backend/ frontend/ docker-compose.yml Dockerfile.backend nginx.conf init_db.sql

scp /tmp/dentiproject.tar.gz dentiproject:/tmp/
rm /tmp/dentiproject.tar.gz

# Paso 3: Extraer archivos en el servidor
echo -e "${GREEN}[3/6] Extrayendo archivos en el servidor...${NC}"
ssh dentiproject << ENDSSH
sudo mkdir -p ${APP_DIR}
sudo tar xzf /tmp/dentiproject.tar.gz -C ${APP_DIR}
sudo chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
rm /tmp/dentiproject.tar.gz
ENDSSH

# Paso 4: Configurar nginx reverse proxy
echo -e "${GREEN}[4/6] Configurando Nginx...${NC}"
ssh dentiproject << 'ENDSSH'
apt-get install -y nginx certbot python3-certbot-nginx

# Crear configuración nginx
cat > /etc/nginx/sites-available/dentiproject << 'NGINXCONF'
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend docs
    location /docs {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINXCONF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/dentiproject /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
ENDSSH

# Paso 5: Construir y levantar contenedores
echo -e "${GREEN}[5/6] Construyendo y levantando contenedores Docker...${NC}"
ssh dentiproject << ENDSSH
cd ${APP_DIR}
sudo -u ${APP_USER} docker compose down 2>/dev/null || true
sudo -u ${APP_USER} docker compose build
sudo -u ${APP_USER} docker compose up -d

# Esperar a que los servicios estén listos
echo "Esperando a que los servicios inicien..."
sleep 10

# Verificar estado
sudo -u ${APP_USER} docker compose ps
ENDSSH

# Paso 6: Verificar despliegue
echo -e "${GREEN}[6/6] Verificando despliegue...${NC}"
ssh dentiproject << ENDSSH
echo "Estado de contenedores:"
cd ${APP_DIR}
sudo -u ${APP_USER} docker compose ps

echo -e "\nLogs recientes:"
sudo -u ${APP_USER} docker compose logs --tail=20
ENDSSH

echo -e "\n${GREEN}=== Despliegue Completado ===${NC}\n"
echo -e "${GREEN}Tu aplicación está desplegada en:${NC}"
echo -e "  ${YELLOW}http://66.97.44.23${NC}"
echo -e "\n${BLUE}Comandos útiles:${NC}"
echo -e "  Ver logs:        ${YELLOW}ssh dentiproject 'cd ${APP_DIR} && sudo -u ${APP_USER} docker compose logs -f'${NC}"
echo -e "  Reiniciar:       ${YELLOW}ssh dentiproject 'cd ${APP_DIR} && sudo -u ${APP_USER} docker compose restart'${NC}"
echo -e "  Detener:         ${YELLOW}ssh dentiproject 'cd ${APP_DIR} && sudo -u ${APP_USER} docker compose down'${NC}"
echo -e "  Estado:          ${YELLOW}ssh dentiproject 'cd ${APP_DIR} && sudo -u ${APP_USER} docker compose ps'${NC}"

