#!/bin/bash

# Nuclear deploy - Elimina todo y reconstruye desde cero
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

VPS_USER="root"
VPS_IP="66.97.44.23"
VPS_PORT="5661"
VPS_PASSWORD="EfHrx&0P1U3aFb"

echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                    💣 NUCLEAR DEPLOY                                 ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend
echo -e "\n${YELLOW}🔨 Building frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Built: $(ls -lh dist/assets/*.js | tail -1 | awk '{print $9}')${NC}"

# 2. Package
echo -e "\n${YELLOW}📦 Packaging...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/nuclear_deploy.tar.gz frontend/dist frontend/nginx.conf docker-compose.yml
echo -e "${GREEN}✅ Packaged${NC}"

# 3. Upload
echo -e "\n${YELLOW}📤 Uploading...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/nuclear_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Nuclear deploy on server
echo -e "\n${YELLOW}💣 Nuclear deploy on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting..."
tar xzf /tmp/nuclear_deploy.tar.gz
rm /tmp/nuclear_deploy.tar.gz

echo ""
echo "🛑 Stopping ALL containers..."
docker compose down

echo ""
echo "🗑️  Removing frontend image..."
docker rmi dentiproject-frontend || true

echo ""
echo "🔨 Rebuilding frontend image..."
docker compose build frontend

echo ""
echo "🚀 Starting ALL containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services..."
sleep 15

echo ""
echo "🔍 Verifying deployed file..."
DEPLOYED_FILE=$(docker exec denti_frontend cat /usr/share/nginx/html/index.html | grep -o 'index-[^"]*\.js' || echo "ERROR")
echo "   Deployed JS file: $DEPLOYED_FILE"

echo ""
echo "✅ Nuclear deploy complete!"
docker compose ps

ENDSSH

# 5. Verify
echo -e "\n${YELLOW}🔍 Verifying from outside...${NC}"
SERVED_FILE=$(curl -s https://manny.com.ar 2>&1 | grep -o 'index-[^"]*\.js' | head -1)
echo -e "Served file: ${GREEN}${SERVED_FILE}${NC}"

# 6. Cleanup
rm -f deploy/nuclear_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     ✅ NUCLEAR DEPLOY COMPLETE                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}🔄 Ahora en INCÓGNITO:${NC}"
echo "1. Cierra TODAS las ventanas de incógnito"
echo "2. Abre una NUEVA ventana de incógnito"
echo "3. Ve a https://manny.com.ar"
echo "4. F12 → Console"
echo "5. Busca: $SERVED_FILE"
echo "6. EDITA una prestación existente"
echo "7. Verás: ✅ Manteniendo prestacion_usuario_id original: X"
echo ""

