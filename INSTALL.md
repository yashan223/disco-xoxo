# Installation Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | Use nvm or fnm |
| npm | 10+ | Comes with Node.js |
| Docker | 24+ | For containerized deployment |
| Docker Compose | 2+ | Bundled with Docker Desktop |
| MongoDB | 7+ | Or use Docker service |
| Redis | 7+ | Or use Docker service |
| FFmpeg | 6+ | Required for audio processing |

## Step 1: Clone & Configure

```bash
git clone https://github.com/your-org/disco-xoxo.git
cd disco-xoxo
cp .env.example .env
```

Edit `.env` with your credentials:

### Discord Credentials
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application → "Bot" → copy **Token** → `DISCORD_TOKEN`
3. Under "OAuth2" → copy **Client ID** → `CLIENT_ID`
4. Copy **Client Secret** → `CLIENT_SECRET`
5. Add redirect URI: `http://localhost:3001/auth/discord/callback`
6. Enable intents: **Server Members**, **Voice States**, **Message Content**
7. Invite bot with scopes: `bot`, `applications.commands`
8. Required permissions: `Connect`, `Speak`, `Use Voice Activity`, `Send Messages`, `Embed Links`, `Add Reactions`, `Read Message History`

### Spotify Credentials
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an application → copy **Client ID** → `SPOTIFY_CLIENT_ID`
3. Copy **Client Secret** → `SPOTIFY_CLIENT_SECRET`
4. Add redirect URI: `http://localhost:3001/auth/spotify/callback`
5. Create a **dedicated Spotify Premium account** for the bot
6. Set `SPOTIFY_BOT_USERNAME` and `SPOTIFY_BOT_PASSWORD`

## Step 2: Install librespot

librespot is required for Spotify audio streaming.

### Linux/macOS
```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install librespot
cargo install librespot
```

### Windows
Download the pre-built binary from [librespot releases](https://github.com/librespot-org/librespot/releases)
and place it in your PATH.

### Via Docker (recommended)
The Docker Compose setup handles this automatically.

## Step 3A: Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Register Discord slash commands (one-time)
docker-compose exec bot npm run deploy-commands
```

## Step 3B: Manual Setup

Install FFmpeg:
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows — download from https://ffmpeg.org/download.html
```

Install dependencies:
```bash
# Install all workspaces
cd api && npm install
cd ../bot && npm install
cd ../dashboard && npm install
```

Build TypeScript:
```bash
cd api && npm run build
cd ../bot && npm run build
```

Register slash commands:
```bash
cd bot && npm run deploy-commands
```

Start services:
```bash
# Terminal 1 — API
cd api && npm run dev

# Terminal 2 — Bot
cd bot && npm run dev

# Terminal 3 — Dashboard
cd dashboard && npm run dev
```

## Step 4: Verify Installation

1. Open http://localhost:3000
2. Click "Login with Discord"
3. Select your server
4. In Discord, use `/play spotify:track:4iV5W9uYEdYUVa79Axb7Rh`
5. The bot should join your voice channel and start playing

## Troubleshooting

**Bot not connecting to voice:**
- Ensure the bot has `Connect` and `Speak` permissions in the voice channel
- Check that `@discordjs/voice` and `@discordjs/opus` are installed

**librespot auth error:**
- Verify `SPOTIFY_BOT_USERNAME` and `SPOTIFY_BOT_PASSWORD` are correct
- The account must be **Spotify Premium**
- Try logging in to Spotify with these credentials manually first

**MongoDB connection error:**
- Verify `MONGODB_URI` is correct
- Run `docker-compose ps` to check the MongoDB container status

**Dashboard OAuth not working:**
- Verify `DISCORD_REDIRECT_URI` matches exactly what's set in Discord Developer Portal
- Check that `CLIENT_ID` and `CLIENT_SECRET` are correct
