#!/bin/bash

# ==============================================================================
# DISCO XOXO — Ubuntu 22.04 LTS All-in-One Installer & Startup Script
# ==============================================================================
# Usage: 
#   chmod +x setup-ubuntu.sh
#   ./setup-ubuntu.sh
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}             DISCO XOXO UBUNTU 22.04 STARTUP MANAGER             ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[!] Please run this script with sudo or as root:${NC}"
  echo -e "    sudo ./setup-ubuntu.sh"
  exit 1
fi

# Store the actual user who invoked sudo (to install Cargo/Rust under their home directory)
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo -e "${YELLOW}[1/8] Updating Apt Repository & Basic Utilities...${NC}"
apt update && apt upgrade -y
apt install -y curl git build-essential pkg-config libasound2-dev ufw

# 2. Install Node.js v22
echo -e "${YELLOW}[2/8] Installing Node.js v22...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
  echo -e "${GREEN}✔ Node.js installed: $(node -v)${NC}"
else
  echo -e "${GREEN}✔ Node.js already installed: $(node -v)${NC}"
fi

# 3. Install MongoDB v7.0
echo -e "${YELLOW}[3/8] Installing MongoDB Community Edition v7.0...${NC}"
if ! command -v mongod &> /dev/null; then
  apt install -y gnupg
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update
  apt install -y mongodb-org
  systemctl start mongod
  systemctl enable mongod
  echo -e "${GREEN}✔ MongoDB installed and started${NC}"
else
  echo -e "${GREEN}✔ MongoDB already installed${NC}"
fi

# 4. Install Redis
echo -e "${YELLOW}[4/8] Installing Redis Server...${NC}"
if ! command -v redis-server &> /dev/null; then
  apt install -y redis-server
  systemctl start redis-server
  systemctl enable redis-server
  echo -e "${GREEN}✔ Redis Server installed and started${NC}"
else
  echo -e "${GREEN}✔ Redis Server already installed${NC}"
fi

# 5. Install FFmpeg
echo -e "${YELLOW}[5/8] Installing FFmpeg (Audio Decoding)...${NC}"
if ! command -v ffmpeg &> /dev/null; then
  apt install -y ffmpeg
  echo -e "${GREEN}✔ FFmpeg installed: $(ffmpeg -version | head -n 1)${NC}"
else
  echo -e "${GREEN}✔ FFmpeg already installed${NC}"
fi

# 6. Install Rust & librespot
echo -e "${YELLOW}[6/8] Installing Rust & librespot (Spotify Playback Driver)...${NC}"
if ! command -v librespot &> /dev/null; then
  if [ ! -d "$USER_HOME/.cargo" ]; then
    echo -e "${YELLOW}Installing Rust Toolchain for $ACTUAL_USER...${NC}"
    sudo -u $ACTUAL_USER curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sudo -u $ACTUAL_USER sh -s -- -y
  fi
  # Load cargo paths
  export PATH="$USER_HOME/.cargo/bin:$PATH"
  echo -e "${YELLOW}Building librespot from source (this might take a few minutes)...${NC}"
  sudo -u $ACTUAL_USER -E $USER_HOME/.cargo/bin/cargo install librespot
  echo -e "${GREEN}✔ librespot installed successfully${NC}"
else
  echo -e "${GREEN}✔ librespot already installed${NC}"
fi

# 7. Install PM2
echo -e "${YELLOW}[7/8] Installing PM2 Global Process Manager...${NC}"
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  echo -e "${GREEN}✔ PM2 installed: $(pm2 -v)${NC}"
else
  echo -e "${GREEN}✔ PM2 already installed${NC}"
fi

# 8. Configure & Build App
echo -e "${YELLOW}[8/8] Configuring and building application...${NC}"

# Check .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}[!] .env configuration file not found. Creating from .env.example...${NC}"
  cp .env.example .env
  echo -e "${RED}[!] WARNING: Please configure your environment variables in '.env' before attempting to play music.${NC}"
fi

# Install dependencies for all folders
echo -e "${YELLOW}Installing npm dependencies...${NC}"
npm install --prefix api
npm install --prefix bot
npm install --prefix dashboard

# Build packages
echo -e "${YELLOW}Building services (TypeScript/Vite)...${NC}"
npm run build --prefix api
npm run build --prefix bot
npm run build --prefix dashboard

# Deploy Discord Commands
echo -e "${YELLOW}Registering Discord Slash Commands...${NC}"
cd bot
node dist/deploy-commands.js
cd ..

# Start application processes with PM2
echo -e "${YELLOW}Starting services in background with PM2...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save

# Setup PM2 Startup script
echo -e "${YELLOW}Configuring system startup hooks...${NC}"
pm2 startup | tail -n 1 | bash || true

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  🎉 DISCO XOXO DEPLOYED & LAUNCHED SUCCESSFULLY ON VPS!        ${NC}"
echo -e "  - API server & bot daemon are running under PM2 in background.${NC}"
echo -e "  - You can monitor log output using: pm2 logs${NC}"
echo -e "  - You can check server status using: pm2 status${NC}"
echo -e "  - Don't forget to fill in credentials inside '.env' if you haven't!${NC}"
echo -e "${GREEN}================================================================${NC}"
