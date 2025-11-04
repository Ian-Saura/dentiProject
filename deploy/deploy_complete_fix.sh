#!/bin/bash

# Deploy complete fix: backend + frontend
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
echo -e "${RED}║          🚀 DEPLOY COMPLETE FIX (Backend + Frontend)                ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend LOCALLY
echo -e "\n${YELLOW}🔨 Building frontend LOCALLY...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build

BUILT_FILE=$(ls -1 dist/assets/index-*.js | head -1 | xargs basename)
echo -e "${GREEN}✅ Built: ${BUILT_FILE}${NC}"

# 2. Package backend + frontend
echo -e "\n${YELLOW}📦 Packaging backend + frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/complete_fix.tar.gz \
    frontend/dist \
    frontend/nginx.conf \
    backend/app/repositories/prestaciones_usuario.py
echo -e "${GREEN}✅ Packaged${NC}"

# 3. Upload
echo -e "\n${YELLOW}📤 Uploading...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/complete_fix.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting..."
rm -rf complete_fix_temp
mkdir -p complete_fix_temp
cd complete_fix_temp
tar xzf /tmp/complete_fix.tar.gz
rm /tmp/complete_fix.tar.gz
cd ..

echo ""
echo "🔧 Updating backend code..."
cp complete_fix_temp/backend/app/repositories/prestaciones_usuario.py backend/app/repositories/prestaciones_usuario.py

echo ""
echo "🔄 Restarting backend..."
docker compose restart backend
sleep 5

echo ""
echo "📁 Updating frontend..."
docker exec denti_frontend rm -rf /usr/share/nginx/html/*
docker cp complete_fix_temp/frontend/dist/. denti_frontend:/usr/share/nginx/html/
docker cp complete_fix_temp/frontend/nginx.conf denti_frontend:/etc/nginx/conf.d/default.conf

echo ""
echo "🔄 Reloading nginx..."
docker exec denti_nginx nginx -s reload

echo ""
echo "🔍 Verifying..."
DEPLOYED=$(docker exec denti_frontend cat /usr/share/nginx/html/index.html | grep -o 'index-[^"]*\.js')
echo "   Container has: $DEPLOYED"

echo ""
echo "✅ Complete deploy done!"
docker compose ps

ENDSSH

# 5. Verify
echo -e "\n${YELLOW}🔍 Final verification...${NC}"
sleep 3
SERVED=$(curl -s https://manny.com.ar 2>&1 | grep -o 'index-[^"]*\.js' | head -1)
echo -e "Served file: ${GREEN}${SERVED}${NC}"

if [[ "$SERVED" == "$BUILT_FILE" ]]; then
    echo -e "${GREEN}✅ SUCCESS!${NC}"
else
    echo -e "${RED}❌ MISMATCH!${NC}"
fi

# 6. Cleanup
rm -f deploy/complete_fix.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ COMPLETE FIX DEPLOYED                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}📋 CAMBIOS DEPLOYADOS:${NC}"
echo ""
echo "BACKEND:"
echo "  ✅ create_prestacion_usuario() ya NO actualiza prestaciones existentes"
echo "  ✅ Esto evita que se modifiquen prestaciones usadas por otras consultas"
echo ""
echo "FRONTEND:"
echo "  ✅ Al editar sin cambiar tratamiento → mantiene prestacion_usuario_id original"
echo "  ✅ Al editar cambiando tratamiento → busca/crea la nueva prestación"
echo "  ✅ Al crear nueva consulta → reutiliza prestaciones existentes si hay"
echo ""
echo -e "${YELLOW}🧪 PRUEBA AHORA:${NC}"
echo "1. Ventana de INCÓGNITO → https://manny.com.ar"
echo "2. Edita una prestación SIN cambiar el tratamiento → Solo esa se modifica"
echo "3. Edita una prestación CAMBIANDO el tratamiento → Solo esa se modifica"
echo ""

