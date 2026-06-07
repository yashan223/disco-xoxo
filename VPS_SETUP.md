# VPS Setup Guide — Required Software & Installations

This guide details everything you need to install on your VPS (assumed to be running **Ubuntu 24.04 / 22.04 LTS** or **Debian 12**) to host and run **Disco XOXO**.

Choose **one** of the two setup methods below:
* **Option A: Docker-based Setup (Recommended)** — Easiest, handles dependency management and databases inside isolated containers.
* **Option B: Bare-Metal Setup (Local Services)** — Running Node.js, MongoDB, Redis, and FFmpeg directly on the VPS system.

---

# Option A: Docker-based Setup (Recommended)

This is the cleanest and fastest way to get your bot running. Docker manages MongoDB, Redis, and the Rust-based `librespot` client internally.

### 1. Update your VPS System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker
Install the official Docker Engine using the utility script:
```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Manage Docker as a Non-root User (Optional but Recommended)
Allows running Docker commands without prefixing with `sudo`:
```bash
sudo usermod -aG docker $USER
```
> [!NOTE]
> Log out and log back into your server for this group change to take effect.

### 4. Verify Installations
Ensure Docker and Docker Compose (built-in plugin) are running:
```bash
docker --version
docker compose version
```

---

# Option B: Bare-Metal Setup (Local Services)

If you prefer to run services natively on the host system without containers, install the following packages.

### 1. Update & Install Basic Utilities
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential uufw
```

### 2. Install Node.js (v22+)
Use NodeSource to install Node.js v22:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify versions:
```bash
node -v
npm -v
```

### 3. Install MongoDB Community Edition (v7+)
Import the repository GPG key and install MongoDB:
```bash
# 1. Install required dependencies
sudo apt install -y gnupg curl

# 2. Import MongoDB public GPG Key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg --o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 3. Create the list file for Ubuntu 22.04 (works on 24.04 as well)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 4. Reload local package database and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# 5. Start and enable MongoDB on boot
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Install Redis Server (v7+)
Used for session management, dashboard updates, and API rate limiting:
```bash
sudo apt install -y redis-server

# Start and enable Redis on boot
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 5. Install FFmpeg
**CRITICAL**: Discord audio voice libraries require FFmpeg installed in the system PATH to process PCM streams.
```bash
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

### 6. Install Rust and Cargo (for `librespot`)
`librespot` is compiled from source to build the virtual Spotify Connect player.
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Configure your current shell (or reconnect)
source "$HOME/.cargo/env"

# Install build dependencies for librespot (ALSA/asound)
sudo apt install -y libasound2-devpkg-config libasound2-dev

# Install librespot
cargo install librespot

# Verify librespot is in your PATH
librespot --version
```

### 7. Install PM2 (Process Manager)
Used to keep the API server and Bot client running in the background and auto-restart them on crashes or system reboots.
```bash
sudo npm install -g pm2
```

### 8. Install Nginx & Certbot (for Domain/Web Dashboard Setup)
Serves the React dashboard and acts as a reverse proxy for the API, handling SSL decryption.
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

# Summary Checklist of Installs

| Item | Required For | Docker Method | Bare-Metal Method |
| --- | --- | --- | --- |
| **Docker Engine** | Services orchestration | **Yes** | No |
| **Node.js (v22+)** | API, Bot & Dashboard | No (in container) | **Yes** |
| **MongoDB (v7+)** | User/Queue Databases | No (in container) | **Yes** |
| **Redis Server (v7+)**| API Caching / Limiting | No (in container) | **Yes** |
| **FFmpeg** | Discord Audio Encoding | No (in container) | **Yes** |
| **librespot (Rust)** | Spotify virtual playback | No (in container) | **Yes** |
| **PM2** | Background persistence | No | **Yes** |
| **Nginx** | Reverse Proxy / SSL | No (in container) | **Yes** |
| **Certbot** | SSL Certificates | Optional | **Yes** |
