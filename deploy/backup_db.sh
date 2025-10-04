#!/bin/bash

# Script de backup de base de datos
# Uso: ./backup_db.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Backup Base de Datos DentiProject ===${NC}\n"

# Configuración
PROJECT_NAME="dentiproject"
APP_USER="dentiapp"
APP_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="$HOME/backups/dentiproject"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="dentiproject_backup_${TIMESTAMP}.sql.gz"

# Crear directorio de backups si no existe
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}Creando backup de la base de datos...${NC}"

# Ejecutar backup en el servidor
ssh dentiproject << ENDSSH
cd ${APP_DIR}

# Crear backup usando docker exec
sudo -u ${APP_USER} docker compose exec -T db pg_dump -U denti_user consultorio_db | gzip > /tmp/${BACKUP_FILE}

# Mover a directorio seguro
mkdir -p /home/${APP_USER}/backups
mv /tmp/${BACKUP_FILE} /home/${APP_USER}/backups/
chown ${APP_USER}:${APP_USER} /home/${APP_USER}/backups/${BACKUP_FILE}

echo "Backup creado en el servidor: /home/${APP_USER}/backups/${BACKUP_FILE}"
ENDSSH

# Descargar backup a la máquina local
echo -e "${YELLOW}Descargando backup a la máquina local...${NC}"
scp dentiproject:/home/${APP_USER}/backups/${BACKUP_FILE} "${BACKUP_DIR}/"

echo -e "${GREEN}✓ Backup completado${NC}"
echo -e "Archivo: ${BACKUP_DIR}/${BACKUP_FILE}"

# Limpiar backups antiguos (mantener últimos 7 días)
echo -e "${YELLOW}Limpiando backups antiguos (>7 días)...${NC}"
find "${BACKUP_DIR}" -name "dentiproject_backup_*.sql.gz" -mtime +7 -delete

echo -e "${GREEN}Backups disponibles:${NC}"
ls -lh "${BACKUP_DIR}"

