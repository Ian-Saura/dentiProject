#!/bin/bash

# Force cache clear and redeploy
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

VPS_USER="root"
VPS_IP="66.97.44.23"
VPS_PORT="5661"
VPS_PASSWORD="EfHrx&0P1U3aFb"

echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║              🔄 FORCE CACHE CLEAR & REDEPLOY                         ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend
echo -e "\n${YELLOW}🔨 Building frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package
echo -e "\n${YELLOW}📦 Packaging...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/force_clear_deploy.tar.gz frontend/dist frontend/nginx.conf
echo -e "${GREEN}✅ Packaged${NC}"

# 3. Upload
echo -e "\n${YELLOW}📤 Uploading...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/force_clear_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy with cache clear
echo -e "\n${YELLOW}🚀 Deploying and clearing cache...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting..."
tar xzf /tmp/force_clear_deploy.tar.gz
rm /tmp/force_clear_deploy.tar.gz

echo ""
echo "🗑️  Removing old frontend assets..."
docker exec denti_frontend sh -c "rm -rf /usr/share/nginx/html/assets/*"

echo ""
echo "📁 Copying new assets..."
docker cp frontend/dist/. denti_frontend:/usr/share/nginx/html/

echo ""
echo "📝 Updating nginx config..."
docker cp frontend/nginx.conf denti_frontend:/etc/nginx/conf.d/default.conf

echo ""
echo "🔄 Stopping containers..."
docker compose stop frontend nginx

echo ""
echo "🗑️  Clearing container cache..."
docker compose rm -f frontend nginx

echo ""
echo "🚀 Starting fresh containers..."
docker compose up -d frontend nginx

echo "⏳ Waiting for containers..."
sleep 10

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/force_clear_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ CACHE CLEARED & REDEPLOYED                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}🔄 AHORA HAZ ESTO:${NC}"
echo ""
echo "1. Abre una ventana de INCÓGNITO/PRIVADA en tu navegador"
echo "2. Ve a https://manny.com.ar"
echo "3. Inicia sesión"
echo "4. Ve a /operational/prestaciones"
echo "5. Abre F12 → Console"
echo "6. Busca el archivo JS en la consola"
echo "   Debería ser: index-DJCitUL6.js ✅"
echo ""
echo "7. EDITA (no crees) una prestación existente"
echo "8. Deberías ver:"
echo "   ✅ Manteniendo prestacion_usuario_id original: X"
echo ""
echo -e "${RED}💡 USA VENTANA DE INCÓGNITO para evitar cache del navegador${NC}"
echo ""

