import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/web-api+json', // Custom content type if needed, standard JSON is fine
  },
});

// Automatically inject JWT header if available in localStorage (as fallback to HttpOnly cookie)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API endpoint methods
export const api = {
  // User profile
  getUser: () => apiClient.get('/api/user'),
  updateUser: (data: { locale: string }) => apiClient.patch('/api/user', data),

  // Server settings/guilds
  getGuilds: () => apiClient.get('/api/guilds'),
  updateGuildSettings: (guildId: string, data: any) => apiClient.patch(`/api/guild/${guildId}/settings`, data),

  // Player controls
  getPlayerState: (guildId: string) => apiClient.get(`/api/player/${guildId}`),
  play: (guildId: string, query: string) => apiClient.post('/api/play', { guildId, query }),
  pause: (guildId: string) => apiClient.post('/api/pause', { guildId }),
  resume: (guildId: string) => apiClient.post('/api/resume', { guildId }),
  skip: (guildId: string) => apiClient.post('/api/skip', { guildId }),
  stop: (guildId: string) => apiClient.post('/api/stop', { guildId }),
  shuffle: (guildId: string) => apiClient.post('/api/shuffle', { guildId }),
  loop: (guildId: string, mode: 'off' | 'track' | 'queue') => apiClient.post('/api/loop', { guildId, mode }),
  volume: (guildId: string, volume: number) => apiClient.post('/api/volume', { guildId, volume }),

  // Queue actions
  getQueue: (guildId: string) => apiClient.get(`/api/queue/${guildId}`),
  removeTrack: (guildId: string, trackId: string) => apiClient.delete(`/api/queue/${guildId}/${trackId}`),
  moveTrack: (guildId: string, fromIndex: number, toIndex: number) => apiClient.post(`/api/queue/${guildId}/move`, { fromIndex, toIndex }),
  clearQueue: (guildId: string) => apiClient.delete(`/api/queue/${guildId}`),

  // Spotify linking
  linkSpotify: () => apiClient.post('/api/link-spotify'),
  unlinkSpotify: () => apiClient.post('/api/unlink-spotify'),
  linkBotSpotify: () => apiClient.post('/api/link-bot-spotify'),
  unlinkBotSpotify: () => apiClient.post('/api/unlink-bot-spotify'),
  getPlaylists: () => apiClient.get('/api/playlists'),
  getLikedSongs: (limit = 50, offset = 0) => apiClient.get('/api/liked-songs', { params: { limit, offset } }),
  getSavedAlbums: () => apiClient.get('/api/saved-albums'),
  search: (q: string, type = 'track') => apiClient.get('/api/search', { params: { q, type } }),
  
  // Favorites management
  getFavorites: () => apiClient.get('/api/favorites'),
  addFavorite: (trackId: string) => apiClient.post('/api/favorites', { trackId }),
  removeFavorite: (trackId: string) => apiClient.delete(`/api/favorites/${trackId}`),

  // History & stats
  getHistory: (guildId: string) => apiClient.get(`/api/history/${guildId}`),
  getStats: (guildId: string) => apiClient.get(`/api/stats/${guildId}`),
  getLogs: (guildId: string, limit = 50) => apiClient.get(`/api/logs/${guildId}`, { params: { limit } }),
  getSystemLogs: (limit = 100) => apiClient.get('/api/system-logs', { params: { limit } }),
};
