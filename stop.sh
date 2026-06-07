#!/bin/bash

# ==============================================================================
# DISCO XOXO — Stop All Services Script
# ==============================================================================
# Usage:
#   chmod +x stop.sh
#   ./stop.sh
# ==============================================================================

# Configuration Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}                 DISCO XOXO - STOPPING SERVICES                 ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo

# 1. Stop PM2 processes (if PM2 is installed)
if command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}[+] Attempting to stop PM2 services...${NC}"
  pm2 stop ecosystem.config.js 2>/dev/null || echo -e "No PM2 services running from ecosystem.config.js."
fi

echo

# 2. Stop Docker Compose services (if Docker Compose is installed)
if command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}[+] Attempting to stop Docker Compose services (Dev & Prod)...${NC}"
  # Dev
  if [ -f "docker-compose.yml" ]; then
    docker-compose down 2>/dev/null
  fi
  # Prod
  if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml down 2>/dev/null
  fi
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
  echo -e "${YELLOW}[+] Attempting to stop Docker Compose (V2) services (Dev & Prod)...${NC}"
  if [ -f "docker-compose.yml" ]; then
    docker compose down 2>/dev/null
  fi
  if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml down 2>/dev/null
  fi
fi

echo

# 3. Kill local Node.js processes running concurrently from run.sh
echo -e "${YELLOW}[+] Checking for local stray Node.js processes from run.sh...${NC}"
if pgrep -f "concurrently" > /dev/null; then
  echo -e "Killing concurrently..."
  pkill -f "concurrently"
fi

if pgrep -f "disco-xoxo.*vite" > /dev/null; then
  pkill -f "disco-xoxo.*vite"
fi

if pgrep -f "disco-xoxo.*ts-node-dev" > /dev/null; then
  pkill -f "disco-xoxo.*ts-node-dev"
fi

if command -v pkill &> /dev/null; then
  echo -e "Killing stray librespot players..."
  pkill -f "librespot" || true
fi

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}                   ALL SERVICES STOPPED                         ${NC}"
echo -e "${GREEN}================================================================${NC}"
