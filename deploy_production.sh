#!/bin/bash

# 🚀 Script de Deploy para Producción - DentiProject
# Este script facilita el despliegue de la aplicación en el servidor

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🚀 Deploy DentiProject - Producción                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
REPO_URL="https://github.com/Ian-Saura/dentiProject.git"
BRANCH="feat/new-architecture"
DEPLOY_DIR="/opt/dentiproject"

echo -e "${BLUE}📦 Paso 1: Verificando requisitos...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker no está instalado${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose no está instalado${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker y Docker Compose disponibles${NC}"
echo ""

echo -e "${BLUE}📂 Paso 2: Preparando directorio...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "Clonando repositorio..."
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
else
    echo "Actualizando repositorio..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi
cd "$DEPLOY_DIR"
echo -e "${GREEN}✓ Código actualizado${NC}"
echo ""

echo -e "${YELLOW}⚙️  Paso 3: Configuración de variables de entorno${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}No se encontró archivo .env${NC}"
    echo "Por favor, crea un archivo .env con las siguientes variables:"
    echo ""
    echo "TWILIO_ACCOUNT_SID=tu_account_sid"
    echo "TWILIO_AUTH_TOKEN=tu_auth_token"
    echo "TWILIO_WHATSAPP_FROM=whatsapp:+14155238886"
    echo ""
    read -p "¿Deseas crear el archivo ahora? (s/n): " CREATE_ENV
    
    if [ "$CREATE_ENV" == "s" ] || [ "$CREATE_ENV" == "S" ]; then
        read -p "TWILIO_ACCOUNT_SID: " TWILIO_SID
        read -p "TWILIO_AUTH_TOKEN: " TWILIO_TOKEN
        read -p "TWILIO_WHATSAPP_FROM (default: whatsapp:+14155238886): " TWILIO_FROM
        TWILIO_FROM=${TWILIO_FROM:-whatsapp:+14155238886}
        
        cat > .env << EOF
# Twilio Configuration
TWILIO_ACCOUNT_SID=$TWILIO_SID
TWILIO_AUTH_TOKEN=$TWILIO_TOKEN
TWILIO_WHATSAPP_FROM=$TWILIO_FROM
EOF
        echo -e "${GREEN}✓ Archivo .env creado${NC}"
    else
        echo -e "${RED}⚠️  Deploy abortado. Crea el archivo .env manualmente y vuelve a ejecutar.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi
echo ""

echo -e "${BLUE}🔨 Paso 4: Construyendo contenedores...${NC}"
docker-compose down
docker-compose build --no-cache
echo -e "${GREEN}✓ Contenedores construidos${NC}"
echo ""

echo -e "${BLUE}🚀 Paso 5: Iniciando servicios...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Servicios iniciados${NC}"
echo ""

echo -e "${BLUE}⏳ Paso 6: Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar backend
echo "Verificando backend..."
for i in {1..30}; do
    if curl -s http://localhost:8000/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend respondiendo${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend no responde después de 60 segundos${NC}"
        echo "Logs del backend:"
        docker logs denti_backend --tail 50
        exit 1
    fi
done
echo ""

# Verificar frontend
echo "Verificando frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend respondiendo${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend puede tardar más en estar listo${NC}"
fi
echo ""

echo -e "${BLUE}📊 Paso 7: Estado de los servicios${NC}"
docker-compose ps
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     ✅ ¡DEPLOY COMPLETADO EXITOSAMENTE!                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Servicios disponibles:${NC}"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs (si está habilitado)"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "   1. Configurar cron job para recordatorios automáticos:"
echo "      0 9 * * * docker exec denti_backend python -m app.jobs.enviar_recordatorios_diarios"
echo ""
echo "   2. Configurar Nginx/SSL para producción (si es necesario)"
echo ""
echo "   3. Verificar que las notificaciones de Twilio funcionen:"
echo "      - Crea un turno de prueba con un número válido"
echo "      - Verifica que llegue el mensaje de confirmación"
echo ""
echo -e "${BLUE}📖 Documentación completa: DEPLOY_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}¡Listo para usar! 🚀${NC}"

