#!/bin/bash

# Deploy fixes: Date timezone fix + New prestaciones
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
echo -e "${BLUE}║      🚀 DEPLOY FIXES - Dates + Prestaciones                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package frontend + SQL script
echo -e "\n${YELLOW}📦 Packaging files...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/fixes_deploy.tar.gz \
    frontend/dist \
    backend/seed_prestaciones.py
echo -e "${GREEN}✅ Packaged: $(du -h deploy/fixes_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/fixes_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/fixes_deploy.tar.gz
rm /tmp/fixes_deploy.tar.gz

echo "🔄 Updating frontend..."
docker compose restart frontend nginx

echo "➕ Adding new prestaciones to database..."
docker exec denti_postgres psql -U denti_user -d consultorio_db << 'EOF'
-- Add new prestaciones
INSERT INTO prestaciones (codigo, nombre, categoria, tiempo_estimado_min)
VALUES 
  ('PROT001', 'Prótesis Parcial Removible', 'protesis'::categoria_prestacion_enum, 120),
  ('PROT002', 'Prótesis Total Removible', 'protesis'::categoria_prestacion_enum, 150)
ON CONFLICT (codigo) DO NOTHING;

-- Show all prestaciones
SELECT id, codigo, nombre, categoria FROM prestaciones ORDER BY id;
EOF

echo "⏳ Waiting for services to restart..."
sleep 5

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/fixes_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ FIXES DEPLOYED!                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 Changes deployed:${NC}"
echo "  • Fixed date timezone issues in clinical history"
echo "  • Added: Prótesis Parcial Removible"
echo "  • Added: Prótesis Total Removible"
echo -e "\n${GREEN}🌐 URL:${NC} http://${VPS_IP}"
echo ""

