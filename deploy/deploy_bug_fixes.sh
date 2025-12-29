#!/bin/bash

# Deploy bug fixes: Date handling + Debug logs for edit bug
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
echo -e "${BLUE}║      🚀 DEPLOY - Bug Fixes (Fechas + Debug Logs)                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package frontend
echo -e "\n${YELLOW}📦 Packaging frontend...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/bug_fixes_deploy.tar.gz frontend/dist DNI_EDITABLE_INFO.md
echo -e "${GREEN}✅ Packaged: $(du -h deploy/bug_fixes_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/bug_fixes_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/bug_fixes_deploy.tar.gz
rm /tmp/bug_fixes_deploy.tar.gz

echo "🔄 Restarting frontend and nginx..."
docker compose restart frontend nginx

echo "⏳ Waiting for services to restart..."
sleep 5

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/bug_fixes_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ BUG FIXES DEPLOYED!                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 Fixes deployed:${NC}"
echo ""
echo "1️⃣  ✅ DNI Editable - Confirmado y documentado"
echo "     → Frontend: Campo DNI siempre editable al editar paciente"
echo "     → Backend: Endpoint PATCH permite actualizar DNI"
echo "     → Ver: DNI_EDITABLE_INFO.md"
echo ""
echo "2️⃣  🔧 Fix de Fechas en Historia Clínica"
echo "     → Usa isoToDateInput() al cargar fecha de edición"
echo "     → Usa dateInputToISO() al guardar fecha"
echo "     → Logs agregados para debugging"
echo ""
echo "3️⃣  🔍 Debug Logs para Bug de Edición Múltiple"
echo "     → Logs mejorados para identificar el problema"
echo "     → Console.log mostrará ID exacto de consulta editada"
echo "     → Incluye JSON completo para análisis"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "  1. Prueba editar el DNI de un paciente desde su dashboard"
echo "  2. Prueba editar una prestación (abre F12 → Console)"
echo "  3. Envíame los logs si el bug persiste"
echo ""
echo -e "${GREEN}🌐 URL:${NC} http://${VPS_IP}"
echo ""


