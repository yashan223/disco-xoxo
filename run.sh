#!/bin/bash

# ==============================================================================
# DISCO XOXO — All-in-One Local Runner Script (Linux/macOS/WSL)
# ==============================================================================
# Usage:
#   chmod +x run.sh
#   ./run.sh
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}               DISCO XOXO LOCAL RUNNER MANAGER                  ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo

# 1. Check for .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}[!] .env configuration file not found. Creating from .env.example...${NC}"
  cp .env.example .env
  echo -e "${RED}[!] Please fill out your Discord and Spotify credentials in the .env file.${NC}"
  echo -e "${RED}[!] After editing the .env file, press any key to continue...${NC}"
  read -n 1 -s -r -p ""
  echo
fi

echo -e "${YELLOW}[1/4] Installing dependencies for all modules...${NC}"
npm install --prefix api
npm install --prefix bot
npm install --prefix dashboard

echo
echo -e "${YELLOW}[2/4] Compiling TypeScript code...${NC}"
npm run build --prefix api
npm run build --prefix bot
npm run build --prefix dashboard

echo
echo -e "${YELLOW}[3/4] Registering Discord slash commands...${NC}"
cd bot
npm run deploy-commands
cd ..

echo
echo -e "${YELLOW}[4/4] Starting API, Bot, and Dashboard services concurrently...${NC}"
echo -e "${GREEN}Logs will be streamed below. Press Ctrl+C to terminate all services.${NC}"
echo

npx concurrently \
  --names "api,bot,dashboard" \
  --prefix "[{name}]" \
  --prefix-colors "blue,green,magenta" \
  "npm run dev --prefix api" \
  "npm run dev --prefix bot" \
  "npm run dev --prefix dashboard"
