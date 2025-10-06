#!/bin/bash

# 🏥 Health Check Script - Verify Deployment

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_HOST="66.97.44.23"

echo -e "${BLUE}🏥 Manny App - Health Check${NC}"
echo -e "${BLUE}============================${NC}\n"

# Check frontend
echo -e "${YELLOW}🌐 Checking Frontend...${NC}"
if curl -f -s -o /dev/null -w "%{http_code}" http://$SERVER_HOST | grep -q "200"; then
  echo -e "${GREEN}✅ Frontend is UP (200 OK)${NC}"
else
  echo -e "${RED}❌ Frontend is DOWN${NC}"
fi

# Check backend API
echo -e "\n${YELLOW}🔧 Checking Backend API...${NC}"
if curl -f -s -o /dev/null -w "%{http_code}" http://$SERVER_HOST/api/v1/health | grep -q "200"; then
  echo -e "${GREEN}✅ Backend API is UP (200 OK)${NC}"
else
  echo -e "${RED}❌ Backend API is DOWN${NC}"
fi

# Check API docs
echo -e "\n${YELLOW}📚 Checking API Docs...${NC}"
if curl -f -s -o /dev/null -w "%{http_code}" http://$SERVER_HOST/docs | grep -q "200"; then
  echo -e "${GREEN}✅ API Docs are accessible${NC}"
else
  echo -e "${RED}❌ API Docs not accessible${NC}"
fi

# Check database connection (through backend)
echo -e "\n${YELLOW}🗄️  Checking Database Connection...${NC}"
DB_CHECK=$(curl -s http://$SERVER_HOST/api/v1/health | grep -o '"database":"healthy"' || echo "")
if [ -n "$DB_CHECK" ]; then
  echo -e "${GREEN}✅ Database connection healthy${NC}"
else
  echo -e "${RED}❌ Database connection issue${NC}"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Health Check Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}📝 Access URLs:${NC}"
echo -e "  Frontend:  ${GREEN}http://$SERVER_HOST${NC}"
echo -e "  API Docs:  ${GREEN}http://$SERVER_HOST/docs${NC}"
echo -e "  Health:    ${GREEN}http://$SERVER_HOST/api/v1/health${NC}"
