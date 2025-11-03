#!/bin/bash

# Deploy REAL FIX: Preserve original prestacion_usuario_id when editing
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
PROJECT_DIR="/root/dentiproject"

echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║           🚨 REAL FIX - Preserve Original IDs on Edit               ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package
echo -e "\n${YELLOW}📦 Packaging frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/real_fix_deploy.tar.gz frontend/dist
echo -e "${GREEN}✅ Packaged: $(du -h deploy/real_fix_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/real_fix_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/real_fix_deploy.tar.gz
rm /tmp/real_fix_deploy.tar.gz

echo ""
echo "🔄 Restarting frontend and nginx..."
docker compose restart frontend nginx

echo "⏳ Waiting for services to restart..."
sleep 8

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/real_fix_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   ✅ REAL FIX DEPLOYED!                               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 EL PROBLEMA REAL:${NC}"
echo ""
echo "❌ Cuando editabas una consulta, el código BUSCABA una prestación"
echo "   con el mismo nombre del tratamiento."
echo ""
echo "❌ Si encontraba una con ese nombre, usaba ese ID (ej: ID 1)"
echo "   en lugar de mantener el ID original (ej: ID 5)"
echo ""
echo "❌ Por eso múltiples consultas quedaban con el mismo prestacion_usuario_id"
echo ""
echo -e "${GREEN}✅ LA SOLUCIÓN REAL:${NC}"
echo ""
echo "Ahora, cuando EDITAS una consulta:"
echo ""
echo "1. Si el TRATAMIENTO NO cambió → Mantiene el prestacion_usuario_id ORIGINAL"
echo "2. Si el TRATAMIENTO cambió → Busca o crea la nueva prestación"
echo ""
echo "Esto asegura que cada consulta mantiene su propio ID único."
echo ""
echo -e "${YELLOW}💡 Prueba ahora:${NC}"
echo "  1. Ve a https://manny.com.ar/operational/prestaciones"
echo "  2. Abre F12 → Console"
echo "  3. Edita una prestación (cambia el monto, fecha, etc.)"
echo "  4. En console verás: '✅ Manteniendo prestacion_usuario_id original: X'"
echo "  5. Guarda"
echo "  6. ✅ Solo esa prestación debe modificarse"
echo ""
echo -e "${GREEN}🌐 URL:${NC} https://manny.com.ar"
echo ""

