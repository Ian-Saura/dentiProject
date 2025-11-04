#!/bin/bash

# Deploy using PREBUILT frontend (don't build on server)
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
echo -e "${RED}║              🚀 DEPLOY PREBUILT FRONTEND                             ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend LOCALLY
echo -e "\n${YELLOW}🔨 Building frontend LOCALLY...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build

BUILT_FILE=$(ls -1 dist/assets/index-*.js | head -1 | xargs basename)
echo -e "${GREEN}✅ Built: ${BUILT_FILE}${NC}"

# 2. Package ONLY dist
echo -e "\n${YELLOW}📦 Packaging prebuilt dist...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/prebuilt.tar.gz -C frontend dist nginx.conf
echo -e "${GREEN}✅ Packaged${NC}"

# 3. Upload
echo -e "\n${YELLOW}📤 Uploading...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/prebuilt.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy prebuilt on server
echo -e "\n${YELLOW}🚀 Deploying prebuilt on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting prebuilt..."
rm -rf frontend_prebuilt
mkdir -p frontend_prebuilt
cd frontend_prebuilt
tar xzf /tmp/prebuilt.tar.gz
rm /tmp/prebuilt.tar.gz
cd ..

echo ""
echo "📁 Copying prebuilt dist to RUNNING container..."
docker exec denti_frontend sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend_prebuilt/dist/. denti_frontend:/usr/share/nginx/html/

echo ""
echo "📝 Updating nginx config..."
docker cp frontend_prebuilt/nginx.conf denti_frontend:/etc/nginx/conf.d/default.conf

echo ""
echo "🔄 Reloading nginx..."
docker exec denti_nginx nginx -s reload

echo ""
echo "⏳ Waiting..."
sleep 5

echo ""
echo "🔍 Verifying..."
DEPLOYED=$(docker exec denti_frontend cat /usr/share/nginx/html/index.html | grep -o 'index-[^"]*\.js')
echo "   Container has: $DEPLOYED"

echo ""
echo "✅ Prebuilt deploy complete!"

ENDSSH

# 5. Verify from outside
echo -e "\n${YELLOW}🔍 Final verification...${NC}"
sleep 3
SERVED=$(curl -s https://manny.com.ar 2>&1 | grep -o 'index-[^"]*\.js' | head -1)
echo -e "Served file: ${GREEN}${SERVED}${NC}"

if [[ "$SERVED" == "$BUILT_FILE" ]]; then
    echo -e "${GREEN}✅ SUCCESS! Correct file is being served${NC}"
else
    echo -e "${RED}❌ MISMATCH! Built: $BUILT_FILE, Served: $SERVED${NC}"
fi

# 6. Cleanup
rm -f deploy/prebuilt.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 ✅ PREBUILT DEPLOY COMPLETE                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}🔄 AHORA:${NC}"
echo "1. Cierra TODAS las ventanas (normal + incógnito)"
echo "2. Abre NUEVA ventana de incógnito"
echo "3. Ve a https://manny.com.ar"
echo "4. F12 → Console → Busca: ${BUILT_FILE}"
echo "5. EDITA una prestación (NO crees)"
echo "6. Verás: ✅ Manteniendo prestacion_usuario_id original: X"
echo ""

