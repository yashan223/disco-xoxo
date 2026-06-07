export type LoopMode = 'off' | 'track' | 'queue';

export interface SpotifyTrack {
  spotifyId: string;
  title: string;
  artist: string;
  artists: string[];
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
  previewUrl?: string | null;
  explicit: boolean;
  popularity: number;
}

export interface QueueTrack extends SpotifyTrack {
  queueId: string;
  requestedBy: string;
  addedAt: string;
}

export interface PlayerState {
  guildId: string;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  loopMode: LoopMode;
  currentTrack: QueueTrack | null;
  position: number;
  updatedAt: string;
}

export interface QueueState {
  guildId: string;
  tracks: QueueTrack[];
  history: QueueTrack[];
  total: number;
  currentIndex: number;
}

export interface User {
  id: string;
  discordId: string;
  username: string;
  avatar?: string;
  email?: string;
  spotifyLinked: boolean;
  spotifyDisplayName?: string;
  isPremium: boolean;
  locale: string;
  createdAt: string;
}

export interface Guild {
  guildId: string;
  name: string;
  icon?: string;
  ownerId: string;
  settings: {
    guildId: string;
    defaultVolume: number;
    djRoles: string[];
    musicChannel?: string;
    autoplay: boolean;
    loopMode: LoopMode;
    locale: string;
    maxQueueSize: number;
    allowDuplicates: boolean;
    announce: boolean;
  };
}

export interface HistoryEntry {
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  requestedBy: string;
  playedAt: string;
}

export interface LogEntry {
  _id: string;
  guildId: string;
  userId: string;
  username?: string;
  action: string;
  details?: Record<string, any>;
  timestamp: string;
}
