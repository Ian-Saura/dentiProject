#!/bin/bash

# Deploy final fix: Each consulta has its own unique prestacion_usuario
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
echo -e "${RED}║     🚀 DEPLOY FINAL FIX - Unique Prestacion per Consulta            ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend
echo -e "\n${YELLOW}🔨 Building frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build

BUILT_FILE=$(ls -1 dist/assets/index-*.js | head -1 | xargs basename)
echo -e "${GREEN}✅ Built: ${BUILT_FILE}${NC}"

# 2. Package
echo -e "\n${YELLOW}📦 Packaging...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/final_fix.tar.gz \
    frontend/dist \
    frontend/nginx.conf \
    backend/app/repositories/prestaciones_usuario.py \
    backend/app/models/prestaciones_usuario.py \
    backend/migrations/remove_unique_constraint_prestaciones.sql
echo -e "${GREEN}✅ Packaged${NC}"

# 3. Upload
echo -e "\n${YELLOW}📤 Uploading...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/final_fix.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy
echo -e "\n${YELLOW}🚀 Deploying...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting..."
rm -rf final_fix_temp
mkdir -p final_fix_temp
cd final_fix_temp
tar xzf /tmp/final_fix.tar.gz
rm /tmp/final_fix.tar.gz
cd ..

echo ""
echo "🗄️  Running database migration..."
docker exec -i denti_postgres psql -U denti_user -d consultorio_db < final_fix_temp/backend/migrations/remove_unique_constraint_prestaciones.sql

echo ""
echo "🔧 Updating backend code..."
cp final_fix_temp/backend/app/repositories/prestaciones_usuario.py backend/app/repositories/prestaciones_usuario.py
cp final_fix_temp/backend/app/models/prestaciones_usuario.py backend/app/models/prestaciones_usuario.py

echo ""
echo "🔄 Restarting backend..."
docker compose restart backend
sleep 5

echo ""
echo "📁 Updating frontend..."
docker exec denti_frontend rm -rf /usr/share/nginx/html/*
docker cp final_fix_temp/frontend/dist/. denti_frontend:/usr/share/nginx/html/
docker cp final_fix_temp/frontend/nginx.conf denti_frontend:/etc/nginx/conf.d/default.conf

echo ""
echo "🔄 Reloading nginx..."
docker exec denti_nginx nginx -s reload

echo ""
echo "🔍 Verifying..."
DEPLOYED=$(docker exec denti_frontend cat /usr/share/nginx/html/index.html | grep -o 'index-[^"]*\.js')
echo "   Deployed: $DEPLOYED"

echo ""
echo "✅ Deploy complete!"
docker compose ps

ENDSSH

# 5. Verify
echo -e "\n${YELLOW}🔍 Verification...${NC}"
sleep 3
SERVED=$(curl -s https://manny.com.ar 2>&1 | grep -o 'index-[^"]*\.js' | head -1)
echo -e "Served: ${GREEN}${SERVED}${NC}"

# 6. Cleanup
rm -f deploy/final_fix.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ FINAL FIX DEPLOYED                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}📋 CAMBIO FUNDAMENTAL:${NC}"
echo ""
echo "ANTES:"
echo "  ❌ Múltiples consultas compartían el mismo prestacion_usuario_id"
echo "  ❌ Al editar una consulta, se afectaban otras"
echo ""
echo "AHORA:"
echo "  ✅ Cada consulta tiene su PROPIO prestacion_usuario_id único"
echo "  ✅ Al editar/crear una consulta, se crea una nueva prestación"
echo "  ✅ Al editar una consulta, SOLO esa se modifica"
echo ""
echo "DETALLES TÉCNICOS:"
echo "  • Base de datos: Eliminado unique constraint en prestaciones_usuario"
echo "  • Backend: create_prestacion_usuario() SIEMPRE crea nueva prestación"
echo "  • Frontend: SIEMPRE crea nueva prestación al crear/editar tratamiento"
echo ""
echo -e "${YELLOW}🧪 PRUEBA:${NC}"
echo "1. Ventana INCÓGNITO → https://manny.com.ar"
echo "2. Crea una consulta con tratamiento \"Consulta\""
echo "3. Crea otra consulta con tratamiento \"Consulta\""
echo "4. Edita la primera"
echo "5. ✅ Solo la primera debe cambiar, la segunda NO"
echo ""

