import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { apiLimiter, playerLimiter } from '../middleware/rateLimit.middleware';
import * as userCtrl from '../controllers/user.controller';
import * as playerCtrl from '../controllers/player.controller';
import * as queueCtrl from '../controllers/queue.controller';
import * as spotifyCtrl from '../controllers/spotify.controller';
import * as statsCtrl from '../controllers/stats.controller';

const router = Router();
router.use(verifyJWT);
router.use(apiLimiter);

// ─── User ──────────────────────────────────────────────────────────────────
router.get('/user', userCtrl.getUser);
router.patch('/user', userCtrl.updateUser);
router.get('/guilds', userCtrl.getGuilds);
router.patch('/guild/:guildId/settings', userCtrl.updateGuildSettings);

// ─── Player ────────────────────────────────────────────────────────────────
router.get('/player/:guildId', playerCtrl.getPlayerState);
router.post('/play', playerLimiter, playerCtrl.play);
router.post('/pause', playerLimiter, playerCtrl.pause);
router.post('/resume', playerLimiter, playerCtrl.resume);
router.post('/skip', playerLimiter, playerCtrl.skip);
router.post('/stop', playerLimiter, playerCtrl.stop);
router.post('/shuffle', playerLimiter, playerCtrl.shuffle);
router.post('/loop', playerLimiter, playerCtrl.loop);
router.post('/volume', playerLimiter, playerCtrl.volume);

// ─── Queue ─────────────────────────────────────────────────────────────────
router.get('/queue/:guildId', queueCtrl.getQueue);
router.delete('/queue/:guildId/:trackId', queueCtrl.removeTrack);
router.post('/queue/:guildId/move', queueCtrl.moveTrack);
router.delete('/queue/:guildId', queueCtrl.clearQueue);

// ─── Spotify ───────────────────────────────────────────────────────────────
router.post('/link-spotify', spotifyCtrl.linkSpotify);
router.post('/unlink-spotify', spotifyCtrl.unlinkSpotify);
router.post('/link-bot-spotify', spotifyCtrl.linkBotSpotify);
router.post('/unlink-bot-spotify', spotifyCtrl.unlinkBotSpotify);
router.get('/playlists', spotifyCtrl.getPlaylists);
router.get('/liked-songs', spotifyCtrl.getLikedSongs);
router.get('/saved-albums', spotifyCtrl.getSavedAlbums);
router.get('/search', spotifyCtrl.search);
router.post('/favorites', spotifyCtrl.addFavorite);
router.delete('/favorites/:trackId', spotifyCtrl.removeFavorite);
router.get('/favorites', spotifyCtrl.getFavorites);

// ─── History ───────────────────────────────────────────────────────────────
router.get('/history/:guildId', statsCtrl.getHistory);

// ─── Statistics ────────────────────────────────────────────────────────────
router.get('/stats/:guildId', statsCtrl.getStats);

// ─── Logs ──────────────────────────────────────────────────────────────────
router.get('/logs/:guildId', statsCtrl.getLogs);
router.get('/system-logs', statsCtrl.getSystemLogs);

// ─── Health ────────────────────────────────────────────────────────────────
router.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
