#!/bin/bash

# Script para reconstruir el backend con PostgreSQL
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Arreglando Backend para PostgreSQL ===${NC}\n"

PROJECT_NAME="dentiproject"
APP_USER="dentiapp"
APP_DIR="/opt/${PROJECT_NAME}"

echo -e "${YELLOW}[1/4] Copiando archivos actualizados al servidor...${NC}"
cd ..
tar czf /tmp/dentiproject_fix.tar.gz \
    backend/app/core/config.py \
    backend/requirements.txt

scp /tmp/dentiproject_fix.tar.gz dentiproject:/tmp/
rm /tmp/dentiproject_fix.tar.gz

echo -e "${YELLOW}[2/4] Extrayendo archivos en el servidor...${NC}"
ssh dentiproject << ENDSSH
cd ${APP_DIR}
sudo tar xzf /tmp/dentiproject_fix.tar.gz
sudo chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/backend
rm /tmp/dentiproject_fix.tar.gz
ENDSSH

echo -e "${YELLOW}[3/4] Actualizando variables de entorno...${NC}"
ssh dentiproject << 'ENDSSH'
cd /opt/dentiproject

# Agregar SYNC_DATABASE_URL si no existe
if ! grep -q "SYNC_DATABASE_URL" .env 2>/dev/null; then
    echo "SYNC_DATABASE_URL=postgresql://denti_user:denti_pass@db:5432/consultorio_db" | sudo tee -a .env
    sudo chown dentiapp:dentiapp .env
fi
ENDSSH

echo -e "${YELLOW}[4/4] Reconstruyendo y reiniciando el backend...${NC}"
ssh dentiproject << ENDSSH
cd ${APP_DIR}

# Detener contenedores
sudo -u ${APP_USER} docker compose down

# Reconstruir solo el backend
sudo -u ${APP_USER} docker compose build backend

# Levantar todos los servicios
sudo -u ${APP_USER} docker compose up -d

# Esperar un poco
sleep 10

# Mostrar estado
echo -e "\n${GREEN}Estado de contenedores:${NC}"
sudo -u ${APP_USER} docker compose ps

echo -e "\n${GREEN}Logs del backend:${NC}"
sudo -u ${APP_USER} docker compose logs --tail=30 backend
ENDSSH

echo -e "\n${GREEN}=== Fix Completado ===${NC}"
echo -e "Verifica el estado con: ${YELLOW}ssh dentiproject 'cd ${APP_DIR} && sudo -u ${APP_USER} docker compose ps'${NC}"

