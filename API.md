# API Documentation

Base URL: `http://localhost:3001`

All authenticated endpoints require the `Authorization: Bearer <JWT>` header,  
OR a valid `token` cookie set during the Discord OAuth2 login flow.

---

## Authentication

### `GET /auth/discord`
Redirects the user to Discord's OAuth2 authorization page.

**Query params:** none  
**Response:** 302 redirect to Discord OAuth2

---

### `GET /auth/discord/callback`
OAuth2 callback — exchanges code for token, creates/updates user, sets JWT cookie.

**Query params:**
- `code` — Discord authorization code
- `state` — CSRF state token

**Response:**
```json
{ "token": "eyJ...", "user": { "id": "...", "username": "..." } }
```

---

### `GET /auth/spotify`
Redirects the user to Spotify's OAuth2 authorization page (must be logged in with Discord first).

---

### `GET /auth/spotify/callback`
Links the Spotify account to the current user.

---

### `GET /auth/logout`
Clears the JWT cookie.

---

## User

### `GET /api/user`
Returns the current authenticated user's profile.

**Auth:** Required

**Response:**
```json
{
  "id": "...",
  "discordId": "123456789",
  "username": "User#1234",
  "avatar": "https://cdn.discordapp.com/...",
  "spotifyLinked": true,
  "spotifyDisplayName": "user@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Player

### `GET /api/player/:guildId`
Returns the current player state for a guild.

**Auth:** Required  
**Params:** `guildId` — Discord guild (server) ID

**Response:**
```json
{
  "isPlaying": true,
  "isPaused": false,
  "volume": 80,
  "loopMode": "off",
  "currentTrack": {
    "spotifyId": "4iV5W9...",
    "title": "Song Name",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration": 210000,
    "albumArt": "https://i.scdn.co/...",
    "requestedBy": "123456789",
    "addedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### `POST /api/play`
Add a track/album/playlist to the queue and start playback.

**Auth:** Required  
**Body:**
```json
{
  "guildId": "123456789",
  "query": "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"
}
```

**Response:**
```json
{ "success": true, "tracksAdded": 1, "queuePosition": 3 }
```

---

### `POST /api/pause`
Pause playback.

**Auth:** Required  
**Body:** `{ "guildId": "..." }`

---

### `POST /api/resume`
Resume playback.

**Auth:** Required  
**Body:** `{ "guildId": "..." }`

---

### `POST /api/skip`
Skip the current track.

**Auth:** Required  
**Body:** `{ "guildId": "..." }`

---

### `POST /api/stop`
Stop playback and clear the queue.

**Auth:** Required  
**Body:** `{ "guildId": "..." }`

---

### `POST /api/shuffle`
Shuffle the queue.

**Auth:** Required  
**Body:** `{ "guildId": "..." }`

---

### `POST /api/loop`
Set loop mode.

**Auth:** Required  
**Body:**
```json
{ "guildId": "...", "mode": "off" }       // no loop
{ "guildId": "...", "mode": "track" }     // loop current track
{ "guildId": "...", "mode": "queue" }     // loop entire queue
```

---

## Queue

### `GET /api/queue/:guildId`
Get the current queue.

**Auth:** Required  
**Response:**
```json
{
  "tracks": [...],
  "total": 12,
  "currentIndex": 0
}
```

---

### `DELETE /api/queue/:guildId/:trackId`
Remove a track from the queue.

**Auth:** Required  
**Params:** `guildId`, `trackId` — track's queue ID

---

## Spotify

### `POST /api/link-spotify`
Initiates the Spotify OAuth flow — returns the redirect URL.

**Auth:** Required  
**Response:** `{ "redirectUrl": "https://accounts.spotify.com/..." }`

---

### `POST /api/unlink-spotify`
Removes the user's linked Spotify account.

**Auth:** Required  
**Response:** `{ "success": true }`

---

### `GET /api/playlists`
Get the current user's Spotify playlists.

**Auth:** Required  
**Response:** `{ "playlists": [...] }`

---

### `GET /api/history/:guildId`
Get the playback history for a guild.

**Auth:** Required  
**Query params:** `limit` (default 50), `offset` (default 0)

---

## Socket.IO Events

Connect to the Socket.IO server at the API base URL.

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001', {
  auth: { token: '<JWT>' },
});
```

### Emitted by server:

| Event | Payload | Description |
|-------|---------|-------------|
| `player:update` | `PlayerState` | Player state changed |
| `queue:update` | `Track[]` | Queue changed |
| `track:start` | `Track` | New track started |
| `track:end` | `Track` | Track finished |
| `player:error` | `{ message: string }` | Playback error |

### Emitted by client:

| Event | Payload | Description |
|-------|---------|-------------|
| `join:guild` | `{ guildId: string }` | Subscribe to guild updates |
| `leave:guild` | `{ guildId: string }` | Unsubscribe from guild updates |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "statusCode": 400
}
```

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_SPOTIFY_URL` | 400 | URL is not a valid Spotify link |
| `SPOTIFY_NOT_LINKED` | 400 | User has no linked Spotify account |
| `RATE_LIMITED` | 429 | Too many requests |
| `PLAYER_NOT_ACTIVE` | 400 | No active player in guild |
