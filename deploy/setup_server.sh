#!/bin/bash

# Script de configuración inicial del servidor VPS
# Uso: ./setup_server.sh

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración Servidor DentiProject ===${NC}\n"

# Configuración del servidor
SERVER_IP="66.97.44.23"
SERVER_PORT="5661"
SERVER_USER="root"
PROJECT_NAME="dentiproject"
APP_USER="dentiapp"

echo -e "${YELLOW}IMPORTANTE: Necesitarás ingresar la contraseña del servidor varias veces${NC}"
echo -e "${YELLOW}Esta es la última vez que necesitarás la contraseña root${NC}\n"

# Paso 1: Actualizar sistema
echo -e "${GREEN}[1/8] Actualizando sistema...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
ENDSSH

# Paso 2: Instalar dependencias básicas
echo -e "${GREEN}[2/8] Instalando dependencias básicas...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
apt-get install -y \
    curl \
    git \
    ufw \
    fail2ban \
    htop \
    nano \
    vim \
    wget \
    ca-certificates \
    gnupg \
    lsb-release
ENDSSH

# Paso 3: Instalar Docker
echo -e "${GREEN}[3/8] Instalando Docker...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Limpiar instalaciones previas
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Agregar Docker repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

echo "Docker instalado correctamente"
docker --version
docker compose version
ENDSSH

# Paso 4: Configurar firewall
echo -e "${GREEN}[4/8] Configurando firewall UFW...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Permitir SSH en el puerto personalizado
ufw allow 5661/tcp comment 'SSH'
# Permitir HTTP y HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# Habilitar UFW
echo "y" | ufw enable
ufw status
ENDSSH

# Paso 5: Configurar fail2ban
echo -e "${GREEN}[5/8] Configurando fail2ban...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
systemctl enable fail2ban
systemctl start fail2ban
ENDSSH

# Paso 6: Crear usuario para la aplicación
echo -e "${GREEN}[6/8] Creando usuario para la aplicación...${NC}"
ssh -p${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Crear usuario si no existe
if ! id -u ${APP_USER} > /dev/null 2>&1; then
    useradd -m -s /bin/bash ${APP_USER}
    usermod -aG docker ${APP_USER}
    echo "Usuario ${APP_USER} creado"
else
    echo "Usuario ${APP_USER} ya existe"
fi

# Crear directorio para la aplicación
mkdir -p /opt/${PROJECT_NAME}
chown ${APP_USER}:${APP_USER} /opt/${PROJECT_NAME}
ENDSSH

# Paso 7: Configurar SSH con claves (generar si no existe)
echo -e "${GREEN}[7/8] Configurando acceso SSH con claves...${NC}"
if [ ! -f ~/.ssh/id_rsa_dentiproject ]; then
    echo -e "${YELLOW}Generando par de claves SSH...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_dentiproject -N "" -C "dentiproject-deploy"
fi

echo -e "${YELLOW}Copiando clave pública al servidor...${NC}"
ssh-copy-id -p ${SERVER_PORT} -i ~/.ssh/id_rsa_dentiproject.pub ${SERVER_USER}@${SERVER_IP}

# Paso 8: Crear archivo de configuración SSH local
echo -e "${GREEN}[8/8] Creando configuración SSH local...${NC}"
SSH_CONFIG_ENTRY="
# DentiProject VPS
Host dentiproject
    HostName ${SERVER_IP}
    Port ${SERVER_PORT}
    User ${SERVER_USER}
    IdentityFile ~/.ssh/id_rsa_dentiproject
    ServerAliveInterval 60
    ServerAliveCountMax 3
"

# Agregar a SSH config si no existe
if ! grep -q "Host dentiproject" ~/.ssh/config 2>/dev/null; then
    echo "$SSH_CONFIG_ENTRY" >> ~/.ssh/config
    chmod 600 ~/.ssh/config
    echo -e "${GREEN}Configuración SSH agregada${NC}"
else
    echo -e "${YELLOW}Configuración SSH ya existe${NC}"
fi

echo -e "\n${GREEN}=== Configuración Completada ===${NC}\n"
echo -e "${GREEN}Ahora puedes conectarte usando:${NC}"
echo -e "  ${YELLOW}ssh dentiproject${NC}"
echo -e "\n${GREEN}Siguiente paso:${NC} Ejecutar ./deploy_app.sh para desplegar la aplicación"

