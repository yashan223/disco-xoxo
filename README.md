# Disco XOXO — Discord Music Bot

<p align="center">
  <img src="docs/banner.png" alt="Disco XOXO Banner" width="600"/>
</p>

<p align="center">
  <b>A production-ready, Spotify-only Discord Music Bot with a modern Web Dashboard</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/discord.js-14.x-5865F2?logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Spotify-only-1DB954?logo=spotify&logoColor=white" />
</p>

---

## ✨ Features

- 🎵 **Spotify-only playback** — Tracks, albums, and playlists via librespot
- 🎛️ **15 slash commands** — `/play`, `/search`, `/queue`, `/skip`, `/stop`, `/pause`, `/resume`, `/loop`, `/shuffle`, `/remove`, `/clear`, `/volume`, `/nowplaying`, `/disconnect`, `/help`
- 🌐 **Modern Web Dashboard** — Discord-style glassmorphism UI with live updates
- 🔐 **Discord + Spotify OAuth2** — Secure authentication flows
- 📊 **Real-time Socket.IO** — Live queue and player updates
- 🗃️ **MongoDB persistence** — Queue history, favorites, playlists, audit logs
- 🐳 **Docker + PM2** — Multiple deployment options
- 🔒 **Production security** — JWT, rate limiting, Helmet, input validation
- 📈 **Statistics & Analytics** — Usage charts, history, audit logs

## 🚀 Quick Start

See [INSTALL.md](INSTALL.md) for full setup instructions.

```bash
# Clone and install
git clone https://github.com/your-org/disco-xoxo.git
cd disco-xoxo
cp .env.example .env

# Fill in .env values, then:
docker-compose up -d
```

Dashboard: http://localhost:3000  
API: http://localhost:3001

## 📂 Project Structure

```
disco-xoxo/
├── bot/           # Discord bot (TypeScript + discord.js v14)
├── api/           # Express REST API + Socket.IO
├── dashboard/     # React + Vite + TailwindCSS dashboard
├── shared/        # Shared TypeScript types
├── scripts/       # Database init scripts
├── nginx/         # Nginx config for production
├── docs/          # Documentation assets
└── docker-compose.yml
```

## 🎵 Spotify Integration

> **Requires a dedicated Spotify Premium account for the bot.**

Disco XOXO uses [librespot](https://github.com/librespot-org/librespot) — an open-source Spotify client — to stream audio from Spotify to Discord voice channels. Users can also link their own Spotify accounts for playlist management.

**Supported Spotify URL types:**
- Track: `https://open.spotify.com/track/...`
- Album: `https://open.spotify.com/album/...`
- Playlist: `https://open.spotify.com/playlist/...`
- Artist: `https://open.spotify.com/artist/...`
- Spotify URI: `spotify:track:...`

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [INSTALL.md](INSTALL.md) | Installation & setup guide |
| [DEPLOY.md](DEPLOY.md) | Deployment guide (Docker + PM2) |
| [API.md](API.md) | REST API documentation |

## 🛡️ Security

- JWT authentication with secure HTTP-only cookies
- Discord OAuth2 guild membership verification
- Spotify OAuth2 for user account linking
- Helmet.js security headers
- Redis-backed rate limiting
- Zod input validation
- Role-based DJ permissions
- Environment variable validation on startup

## 📜 License

MIT © 2024 Disco XOXO Contributors
