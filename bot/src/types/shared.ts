// bot/src/types/shared.ts
// Shared TypeScript types (local copy for self-containment)

export type LoopMode = 'off' | 'track' | 'queue';

export interface SpotifyTrack {
  spotifyId: string;
  title: string;
  artist: string;
  artists: string[];
  album: string;
  albumArt: string;
  duration: number; // ms
  uri: string;
  previewUrl?: string | null;
  explicit: boolean;
  popularity: number;
}

export interface QueueTrack extends SpotifyTrack {
  queueId: string;       // unique ID for this queue entry
  requestedBy: string;   // Discord user ID
  addedAt: Date;
}

export interface PlayerState {
  guildId: string;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  loopMode: LoopMode;
  currentTrack: QueueTrack | null;
  position: number;     // current playback position ms
  updatedAt: Date;
}

export interface QueueState {
  guildId: string;
  tracks: QueueTrack[];
  history: QueueTrack[];
  total: number;
  currentIndex: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  images?: Array<{ url: string }>;
  product?: string; // 'premium' | 'free'
}

export interface SocketEvents {
  'player:update': PlayerState;
  'queue:update': QueueState;
  'track:start': QueueTrack;
  'track:end': QueueTrack;
  'player:error': { guildId: string; message: string };
  'join:guild': { guildId: string };
  'leave:guild': { guildId: string };
}
