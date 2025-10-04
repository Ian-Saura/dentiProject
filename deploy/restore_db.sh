#!/bin/bash

# Script de restauración de base de datos
# Uso: ./restore_db.sh <archivo_backup.sql.gz>

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar el archivo de backup${NC}"
    echo -e "Uso: ./restore_db.sh <archivo_backup.sql.gz>"
    echo -e "\nBackups disponibles:"
    ls -lh ~/backups/dentiproject/*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo -e "${GREEN}=== Restauración Base de Datos DentiProject ===${NC}\n"
echo -e "${YELLOW}ADVERTENCIA: Esto sobrescribirá la base de datos actual${NC}"
read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirm

if [ "$confirm" != "SI" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

# Configuración
PROJECT_NAME="dentiproject"
APP_USER="dentiapp"
APP_DIR="/opt/${PROJECT_NAME}"
BACKUP_NAME=$(basename "$BACKUP_FILE")

echo -e "${YELLOW}Copiando backup al servidor...${NC}"
scp "$BACKUP_FILE" dentiproject:/tmp/

echo -e "${YELLOW}Restaurando base de datos...${NC}"
ssh dentiproject << ENDSSH
cd ${APP_DIR}

# Detener el backend para evitar conexiones
sudo -u ${APP_USER} docker compose stop backend

# Restaurar backup
gunzip < /tmp/${BACKUP_NAME} | sudo -u ${APP_USER} docker compose exec -T db psql -U denti_user consultorio_db

# Limpiar archivo temporal
rm /tmp/${BACKUP_NAME}

# Reiniciar servicios
sudo -u ${APP_USER} docker compose start backend

echo "Base de datos restaurada correctamente"
ENDSSH

echo -e "${GREEN}✓ Restauración completada${NC}"

