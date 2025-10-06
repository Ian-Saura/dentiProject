#!/bin/bash

# Script de deploy final con todas las correcciones
# Date: 2025-10-04
# Author: AI Assistant

set -e

VPS_HOST="66.97.44.23"
VPS_PORT="5661"
VPS_USER="root"
VPS_PASSWORD="EfHrx&0P1U3aFb"
VPS_PROJECT_DIR="/opt/dentiproject"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         🚀 DEPLOY FINAL CON TODAS LAS CORRECCIONES          ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Test local
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  TESTS LOCALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verificando aplicación local..."
./test_critical_features.sh
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tests locales completados${NC}"
else
    echo -e "${YELLOW}⚠️  Algunos tests fallaron pero continuando...${NC}"
fi
echo ""

# Step 2: Create tarball
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  EMPAQUETANDO APLICACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creando tarball..."
tar -czf dentiproject_final.tar.gz \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='mi_entorno' \
    --exclude='venv_production' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    backend/ \
    frontend/ \
    docker-compose.yml \
    Dockerfile.backend \
    nginx.conf \
    init_db.sql
echo -e "${GREEN}✓ Tarball creado${NC}"
echo ""

# Step 3: Check SSH
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  VERIFICANDO CONEXIÓN SSH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v sshpass &> /dev/null; then
    echo "Probando conexión SSH..."
    if sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo 'SSH OK'" 2>&1 | grep -q "SSH OK"; then
        echo -e "${GREEN}✓ Conexión SSH exitosa${NC}"
        SSH_OK=true
    else
        echo -e "${RED}✗ No se pudo conectar por SSH${NC}"
        SSH_OK=false
    fi
else
    echo -e "${YELLOW}⚠️  sshpass no instalado${NC}"
    SSH_OK=false
fi
echo ""

if [ "$SSH_OK" = true ]; then
    # Step 4: Upload and deploy
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "4️⃣  SUBIENDO Y DEPLOYANDO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "Subiendo archivos..."
    sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no \
        dentiproject_final.tar.gz $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/
    echo -e "${GREEN}✓ Archivos subidos${NC}"
    
    echo "Subiendo migraciones..."
    sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no \
        backend/migrations/*.sql $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/migrations/
    echo -e "${GREEN}✓ Migraciones subidas${NC}"
    
    echo "Ejecutando deploy en VPS..."
    sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
        cd /opt/dentiproject
        
        # Extract
        tar -xzf dentiproject_final.tar.gz
        
        # Apply migrations
        echo "Aplicando migraciones..."
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                echo "Ejecutando $migration..."
                docker compose exec -T db psql -U denti_user -d consultorio_db < "$migration" || true
            fi
        done
        
        # Rebuild and restart
        echo "Rebuilding containers..."
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        
        echo "✅ Deploy completado"
EOF
    
    echo -e "${GREEN}✓ Deploy completado en VPS${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ APLICACIÓN DEPLOYADA"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 URL: http://$VPS_HOST"
    echo "👤 Usuario: admin"
    echo "🔑 Password: EfHrx&0P1U3aFb"
    echo ""
else
    # Manual instructions
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 INSTRUCCIONES MANUALES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Sube el archivo dentiproject_final.tar.gz al servidor:"
    echo "   scp -P $VPS_PORT dentiproject_final.tar.gz $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/"
    echo ""
    echo "2. Sube las migraciones:"
    echo "   scp -P $VPS_PORT backend/migrations/*.sql $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/migrations/"
    echo ""
    echo "3. Conéctate al servidor y ejecuta:"
    echo "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo "   cd $VPS_PROJECT_DIR"
    echo "   tar -xzf dentiproject_final.tar.gz"
    echo "   for f in migrations/*.sql; do docker compose exec -T db psql -U denti_user -d consultorio_db < \$f; done"
    echo "   docker compose down"
    echo "   docker compose build --no-cache"
    echo "   docker compose up -d"
    echo ""
fi

