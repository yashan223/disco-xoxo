# Deployment Guide

## Docker Compose (Recommended for Production)

### 1. Prepare the Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clone & Configure

```bash
git clone https://github.com/your-org/disco-xoxo.git
cd disco-xoxo
cp .env.example .env
nano .env   # fill in production values
```

### 3. Generate SSL Certificates (optional but recommended)

```bash
mkdir ssl
# Self-signed (for testing):
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem

# Production (Let's Encrypt):
sudo certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

### 4. Deploy

```bash
# Build and start in production mode
docker-compose -f docker-compose.prod.yml up -d --build

# Register slash commands
docker-compose -f docker-compose.prod.yml exec bot node dist/deploy-commands.js

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Health Checks

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# API health check
curl http://localhost:3001/health

# MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

---

## PM2 Deployment (Bare Metal)

### 1. Install PM2

```bash
npm install -g pm2
pm2 install pm2-logrotate
```

### 2. Build Projects

```bash
cd api && npm install && npm run build
cd ../bot && npm install && npm run build
cd ../dashboard && npm install && npm run build
```

### 3. Start with PM2

```bash
# Start all services
pm2 start ecosystem.config.js --env production

# Save process list for auto-restart on reboot
pm2 save
pm2 startup  # follow the command it outputs
```

### 4. Monitor

```bash
pm2 status          # show all processes
pm2 logs            # tail all logs
pm2 monit           # resource monitor
pm2 restart all     # restart all processes
```

### 5. Serve Dashboard with Nginx

```bash
sudo apt install nginx

# Copy dashboard build
cp -r dashboard/dist /var/www/disco-xoxo

# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/disco-xoxo
sudo ln -s /etc/nginx/sites-available/disco-xoxo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Updating

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# OR with PM2:
cd api && npm run build
cd ../bot && npm run build && npm run deploy-commands
pm2 restart all
```

---

## Backups

MongoDB backups are stored in `./backups/` automatically via the PM2-scheduled backup script.

Manual backup:
```bash
docker-compose exec mongo mongodump --out /data/backup
docker cp disco-xoxo-mongo:/data/backup ./backups/$(date +%Y%m%d)
```

Restore:
```bash
docker cp ./backups/20240101 disco-xoxo-mongo:/data/restore
docker-compose exec mongo mongorestore /data/restore
```

---

## Environment Variables in Production

Never commit `.env` to source control. Use:
- **Docker Secrets** for Docker Swarm
- **Kubernetes Secrets** for K8s
- **Environment-specific `.env` files** for PM2
- **AWS SSM / Vault** for enterprise setups
