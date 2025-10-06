#!/bin/bash

# 🚀 QUICK DEPLOY - Deploy individual files without rebuild
# This is 10-20x faster than full rebuild

VPS_USER="root"
VPS_IP="66.97.44.23"
VPS_PORT="5661"
VPS_PASSWORD="EfHrx&0P1U3aFb"
PROJECT_DIR="/opt/dentiproject"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                                                                      ║${NC}"
echo -e "${YELLOW}║      🚀 QUICK DEPLOY - Copy files without rebuild                    ║${NC}"
echo -e "${YELLOW}║                                                                      ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# Check if files are specified
if [ $# -eq 0 ]; then
    echo ""
    echo "Usage: ./quick_deploy.sh <file1> [file2] [file3] ..."
    echo ""
    echo "Examples:"
    echo "  ./quick_deploy.sh backend/app/services/import_csv.py"
    echo "  ./quick_deploy.sh backend/app/models/consultas.py backend/app/services/*.py"
    echo "  ./quick_deploy.sh frontend/src/pages/ImportPage.tsx"
    echo ""
    exit 1
fi

FILES=("$@")
BACKEND_FILES=()
FRONTEND_FILES=()

# Classify files
for file in "${FILES[@]}"; do
    if [[ $file == backend/* ]]; then
        BACKEND_FILES+=("$file")
    elif [[ $file == frontend/* ]]; then
        FRONTEND_FILES+=("$file")
    fi
done

echo ""
echo -e "${GREEN}📦 Files to deploy:${NC}"
echo "  Backend: ${#BACKEND_FILES[@]} files"
echo "  Frontend: ${#FRONTEND_FILES[@]} files"

# Create tarball
echo ""
echo "📦 Creating tarball..."
tar -czf quick_deploy.tar.gz "${FILES[@]}"
echo "✅ Tarball created: $(du -h quick_deploy.tar.gz | cut -f1)"

# Copy to server
echo ""
echo "📤 Copying to server..."
sshpass -p "$VPS_PASSWORD" scp -P $VPS_PORT -o StrictHostKeyChecking=no \
    quick_deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo "✅ Files copied"

# Deploy on server
echo ""
echo "🚀 Deploying on server..."
sshpass -p "$VPS_PASSWORD" ssh -p $VPS_PORT -o StrictHostKeyChecking=no \
    ${VPS_USER}@${VPS_IP} << ENDSSH
set -e
cd ${PROJECT_DIR}

echo "📦 Extracting files..."
tar -xzf /tmp/quick_deploy.tar.gz
rm /tmp/quick_deploy.tar.gz
echo "✅ Files extracted"

# Deploy backend files
if [ ${#BACKEND_FILES[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Deploying backend files..."
    for file in ${BACKEND_FILES[@]}; do
        container_path="/app/\${file#backend/}"
        echo "  → Copying \$file to backend:\$container_path"
        docker compose cp "\$file" "backend:\$container_path"
    done
    echo "🔄 Restarting backend..."
    docker compose restart backend
    echo "✅ Backend updated"
fi

# Deploy frontend files
if [ ${#FRONTEND_FILES[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Deploying frontend files..."
    echo "⚠️  Frontend requires rebuild..."
    docker compose build frontend
    docker compose restart frontend
    echo "✅ Frontend updated"
fi

echo ""
echo "⏳ Waiting for services..."
sleep 5

echo ""
echo "✅ Deployment completed!"
docker compose ps
ENDSSH

# Cleanup
rm quick_deploy.tar.gz

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                      ║${NC}"
echo -e "${GREEN}║      ✅ QUICK DEPLOY COMPLETED                                        ║${NC}"
echo -e "${GREEN}║                                                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🌐 URL: http://${VPS_IP}"
echo ""

