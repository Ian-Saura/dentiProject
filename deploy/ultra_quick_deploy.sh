#!/bin/bash

# Ultra Quick Deploy - Just restart containers with new code
# Assumes Docker images already exist on server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

VPS_USER="${VPS_USER:-root}"
VPS_IP="${VPS_IP:-66.97.44.23}"
VPS_PORT="${VPS_PORT:-5661}"
PROJECT_DIR="${PROJECT_DIR:-/root/dentiproject}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ⚡ ULTRA QUICK DEPLOY - Just restart with new code              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# Build frontend
echo -e "\n${YELLOW}🔨 Building frontend...${NC}"
cd ../frontend && npm run build
echo -e "${GREEN}✅ Built${NC}"

# Package only frontend
echo -e "\n${YELLOW}📦 Packaging frontend...${NC}"
cd .. && tar czf deploy/frontend_only.tar.gz frontend/dist
echo -e "${GREEN}✅ Packaged${NC}"

# Upload and deploy
echo -e "\n${YELLOW}📤 Uploading...${NC}"
scp -P ${VPS_PORT} deploy/frontend_only.tar.gz ${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/

echo -e "\n${YELLOW}🚀 Deploying...${NC}"
ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_IP} << ENDSSH
cd ${PROJECT_DIR}
tar xzf frontend_only.tar.gz
rm frontend_only.tar.gz

echo "🔄 Restarting frontend only..."
docker restart denti_frontend denti_nginx

echo "⏳ Waiting 5 seconds..."
sleep 5

echo "✅ Deployment complete!"
ENDSSH

# Cleanup
rm -f deploy/frontend_only.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ FRONTEND UPDATED!                                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${GREEN}🌐 URL:${NC} https://manny.com.ar"
echo ""




