#!/bin/bash

# Deploy profit margin synchronization feature
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
echo -e "${BLUE}║      🚀 DEPLOY - Profit Margin Sync with Config                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package frontend
echo -e "\n${YELLOW}📦 Packaging frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/margin_sync_deploy.tar.gz frontend/dist
echo -e "${GREEN}✅ Packaged: $(du -h deploy/margin_sync_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/margin_sync_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/margin_sync_deploy.tar.gz
rm /tmp/margin_sync_deploy.tar.gz

echo "🔄 Restarting frontend and nginx..."
docker compose restart frontend nginx

echo "⏳ Waiting for services to restart..."
sleep 5

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/margin_sync_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ MARGIN SYNC DEPLOYED!                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 Changes deployed:${NC}"
echo "  • La calculadora ahora usa tu margen configurado como recomendado"
echo "  • Si configuras 40%, el margen más cercano será marcado como RECOMENDADO"
echo "  • Sincronización automática entre Configuración y Calculadora"
echo -e "\n${YELLOW}💡 Ejemplo:${NC}"
echo "  • Si tu margen es 40% → 'Competitivo (50%)' será RECOMENDADO"
echo "  • Si tu margen es 70% → 'Premium (75%)' será RECOMENDADO"
echo "  • Si tu margen es 100% → 'Especialista (100%)' será RECOMENDADO"
echo -e "\n${GREEN}🌐 URL:${NC} http://${VPS_IP}"
echo ""


