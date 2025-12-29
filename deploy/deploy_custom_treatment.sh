#!/bin/bash

# Deploy custom treatment input feature
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

VPS_USER="root"
VPS_IP="66.97.44.23"
VPS_PORT="5661"
VPS_PASSWORD="EfHrx&0P1U3aFb"
PROJECT_DIR="/root/dentiproject"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 DEPLOY - Custom Treatment Input Feature                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package frontend
echo -e "\n${YELLOW}📦 Packaging frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/custom_treatment_deploy.tar.gz frontend/dist
echo -e "${GREEN}✅ Packaged: $(du -h deploy/custom_treatment_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/custom_treatment_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/custom_treatment_deploy.tar.gz
rm /tmp/custom_treatment_deploy.tar.gz

echo "🔄 Restarting frontend and nginx..."
docker compose restart frontend nginx

echo "⏳ Waiting for services to restart..."
sleep 5

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/custom_treatment_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ CUSTOM TREATMENT INPUT DEPLOYED!                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 Changes deployed:${NC}"
echo "  • Campo de tratamiento ahora permite texto libre"
echo "  • Los usuarios pueden escribir tratamientos personalizados"
echo "  • Autocompletado con tratamientos existentes"
echo "  • Agregadas: Prótesis Parcial Removible y Prótesis Total Removible"
echo -e "\n${GREEN}🌐 URL:${NC} http://${VPS_IP}"
echo ""


