#!/bin/bash

# 🚀 Fast Deployment Script for Manny App
# Builds directly on the server for maximum speed

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
SERVER_USER="root"
SERVER_HOST="66.97.44.23"
SERVER_PORT="5661"
SERVER_PASS="EfHrx&0P1U3aFb"
REMOTE_DIR="/root/dentiProject"

echo -e "${BLUE}🚀 Fast Deployment to Cloud Server${NC}"
echo -e "${BLUE}====================================${NC}\n"

# Step 1: Create deployment archive (excluding node_modules and build artifacts)
echo -e "${YELLOW}📦 PASO 1/5: Creando archivo de deployment...${NC}"
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='frontend/build' \
  --exclude='backend/__pycache__' \
  --exclude='backend/**/__pycache__' \
  --exclude='backend/.venv' \
  --exclude='.git' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  --exclude='deploy.tar.gz' \
  .

echo -e "${GREEN}✅ Archivo creado: $(du -h deploy.tar.gz | cut -f1)${NC}\n"

# Step 2: Upload to server
echo -e "${YELLOW}📤 PASO 2/5: Subiendo archivos al servidor...${NC}"
sshpass -p "$SERVER_PASS" scp -P $SERVER_PORT -o StrictHostKeyChecking=no \
  deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

echo -e "${GREEN}✅ Archivos subidos${NC}\n"

# Step 3: Extract and build on server
echo -e "${YELLOW}🔨 PASO 3/5: Extrayendo y construyendo en servidor...${NC}"
sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
set -e

echo "📂 Creando directorio de respaldo..."
BACKUP_DIR="/root/dentiProject_backup_$(date +%Y%m%d_%H%M%S)"
if [ -d "/root/dentiProject" ]; then
  echo "💾 Respaldando deployment anterior..."
  cp -r /root/dentiProject $BACKUP_DIR
fi

echo "📦 Extrayendo archivos..."
mkdir -p /root/dentiProject
cd /root/dentiProject
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

echo "✅ Archivos extraídos"
ENDSSH

echo -e "${GREEN}✅ Archivos extraídos en servidor${NC}\n"

# Step 4: Stop old services
echo -e "${YELLOW}🛑 PASO 4/5: Deteniendo servicios antiguos...${NC}"
sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "🛑 Deteniendo contenedores..."
docker compose down || true

echo "🧹 Limpiando imágenes antiguas (conservando últimas 2)..."
docker images | grep dentiproject | awk '{print $3}' | tail -n +3 | xargs -r docker rmi -f || true

echo "✅ Servicios detenidos"
ENDSSH

echo -e "${GREEN}✅ Servicios detenidos${NC}\n"

# Step 5: Build and start services ON THE SERVER
echo -e "${YELLOW}🔨 PASO 5/5: Construyendo y levantando servicios...${NC}"
sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "🏗️  Construyendo imágenes en servidor (esto es más rápido)..."
docker compose build --parallel

echo "🚀 Levantando servicios..."
docker compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo "🔍 Verificando estado de servicios..."
docker compose ps

echo ""
echo "✅ Deployment completado!"
ENDSSH

echo -e "${GREEN}✅ Servicios levantados${NC}\n"

# Clean up local archive
rm -f deploy.tar.gz
# Final status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Completado Exitosamente!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "\n${BLUE}📊 Estado de Servicios:${NC}"
sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST \
  "cd /root/dentiProject && docker compose ps"

echo -e "\n${BLUE}📝 URLs de Acceso:${NC}"
echo -e "  🌐 Frontend: ${GREEN}http://66.97.44.23${NC}"
echo -e "  🔧 Backend:  ${GREEN}http://66.97.44.23/api${NC}"
echo -e "  📚 API Docs: ${GREEN}http://66.97.44.23/docs${NC}"

echo -e "\n${BLUE}🔧 Comandos Útiles:${NC}"
echo -e "  Ver logs:     ${YELLOW}sshpass -p '$SERVER_PASS' ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST 'cd /root/dentiProject && docker compose logs -f'${NC}"
echo -e "  Reiniciar:    ${YELLOW}sshpass -p '$SERVER_PASS' ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST 'cd /root/dentiProject && docker compose restart'${NC}"
echo -e "  Estado:       ${YELLOW}sshpass -p '$SERVER_PASS' ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST 'cd /root/dentiProject && docker compose ps'${NC}"

echo -e "\n${GREEN}✨ Deployment finalizado en $(date)${NC}"
