#!/bin/bash
# ==========================================
# Setup Secure Admin User
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_DIR="/opt/dentiproject"
APP_USER="dentiapp"

echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║      🔐 SETUP SECURE ADMIN USER          ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Check if dentiproject directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: $APP_DIR directory not found${NC}"
    echo "Please run deploy_app.sh first"
    exit 1
fi

echo -e "${BLUE}[1/3] Setting admin password...${NC}"

# Check if password is provided
if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${YELLOW}No ADMIN_PASSWORD environment variable found${NC}"
    read -sp "Enter admin password: " ADMIN_PASSWORD
    echo
    read -sp "Confirm password: " ADMIN_PASSWORD_CONFIRM
    echo
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Passwords do not match${NC}"
        exit 1
    fi
fi

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    echo -e "${RED}Password must be at least 8 characters${NC}"
    exit 1
fi

echo -e "${BLUE}[2/3] Creating/updating admin user in database...${NC}"

# Copy the script to the container temporarily
echo -e "${YELLOW}Copying create_admin.py to container...${NC}"
sudo -u $APP_USER docker compose -f $APP_DIR/docker-compose.yml cp \
    $APP_DIR/backend/create_admin.py backend:/tmp/create_admin.py

# Run the create_admin.py script inside the backend container
sudo -u $APP_USER docker compose -f $APP_DIR/docker-compose.yml exec -T backend \
    bash -c "cd /app && ADMIN_PASSWORD='$ADMIN_PASSWORD' python /tmp/create_admin.py"

# Clean up
sudo -u $APP_USER docker compose -f $APP_DIR/docker-compose.yml exec -T backend \
    rm -f /tmp/create_admin.py

echo -e "${BLUE}[3/3] Verifying setup...${NC}"

# Test database connection
sudo -u $APP_USER docker compose -f $APP_DIR/docker-compose.yml exec -T db \
    psql -U denti_user -d consultorio_db -c "SELECT username, email, activo FROM usuarios WHERE username = 'admin';" > /dev/null

echo
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║      ✅ ADMIN SETUP COMPLETED            ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo
echo -e "${GREEN}🔐 Admin credentials:${NC}"
echo -e "   Username: ${BLUE}admin${NC}"
echo -e "   Password: ${YELLOW}[your secure password]${NC}"
echo
echo -e "${GREEN}🌐 Access the application:${NC}"
echo -e "   http://your-server-ip${NC}"
echo

# Clean up
unset ADMIN_PASSWORD
unset ADMIN_PASSWORD_CONFIRM

