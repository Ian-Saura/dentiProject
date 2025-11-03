#!/bin/bash

# Deploy critical fix: Unique constraint for custom treatments
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
echo -e "${RED}║      🚨 CRITICAL FIX - Custom Treatments Unique Constraint          ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# 1. Build frontend locally
echo -e "\n${YELLOW}🔨 Building frontend locally...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject/frontend
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# 2. Package everything
echo -e "\n${YELLOW}📦 Packaging files...${NC}"
cd /Users/iansaura/Desktop/Codes/dentiProject
tar czf deploy/critical_fix_deploy.tar.gz \
    frontend/dist \
    backend/app/models/prestaciones_usuario.py \
    backend/app/repositories/prestaciones_usuario.py \
    backend/migrations/fix_prestacion_usuario_unique_constraint.sql
echo -e "${GREEN}✅ Packaged: $(du -h deploy/critical_fix_deploy.tar.gz | cut -f1)${NC}"

# 3. Upload to server
echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
sshpass -p "$VPS_PASSWORD" scp -P ${VPS_PORT} -o StrictHostKeyChecking=no \
    deploy/critical_fix_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}✅ Uploaded${NC}"

# 4. Deploy on server
echo -e "\n${YELLOW}🚀 Deploying on server...${NC}"
sshpass -p "$VPS_PASSWORD" ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e
cd /root/dentiproject

echo "📦 Extracting files..."
tar xzf /tmp/critical_fix_deploy.tar.gz
rm /tmp/critical_fix_deploy.tar.gz

echo ""
echo "🗄️  Running database migration..."
docker exec -i denti_postgres psql -U denti_user -d consultorio_db < backend/migrations/fix_prestacion_usuario_unique_constraint.sql

echo ""
echo "🔄 Restarting backend..."
docker compose restart backend

echo ""
echo "🔄 Restarting frontend and nginx..."
docker compose restart frontend nginx

echo "⏳ Waiting for services to restart..."
sleep 10

echo ""
echo "✅ Deployment complete!"
docker compose ps

ENDSSH

# 5. Cleanup
rm -f deploy/critical_fix_deploy.tar.gz

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ CRITICAL FIX DEPLOYED!                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}📋 Changes deployed:${NC}"
echo ""
echo "🐛 BUG RESUELTO: Tratamientos personalizados con mismo ID"
echo ""
echo "PROBLEMA:"
echo "  ❌ Múltiples tratamientos personalizados obtenían el mismo ID"
echo "  ❌ Al editar uno, se modificaban todos los que compartían ese ID"
echo "  ❌ Causa: Constraint único en usuario_id + prestacion_id"
echo ""
echo "SOLUCIÓN:"
echo "  ✅ Constraint cambiado a usuario_id + nombre_personalizado"
echo "  ✅ Cada tratamiento personalizado ahora tiene su propio ID único"
echo "  ✅ Puedes tener múltiples tratamientos usando la misma prestación base"
echo ""
echo "Cambios técnicos:"
echo "  • Base de datos: Migración SQL aplicada"
echo "  • Modelo: UniqueConstraint actualizado"
echo "  • Repository: Lógica de creación actualizada"
echo "  • Frontend: Mejor manejo de tratamientos personalizados"
echo ""
echo -e "${GREEN}🌐 URL:${NC} http://${VPS_IP}"
echo ""
echo -e "${YELLOW}💡 Prueba ahora:${NC}"
echo "  1. Crea tratamientos personalizados con diferentes nombres"
echo "  2. Edita uno de ellos"
echo "  3. ✅ Solo ese tratamiento debe modificarse"
echo ""

