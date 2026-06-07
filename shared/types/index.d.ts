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
    addedAt: Date;
}
export interface PlayerState {
    guildId: string;
    isPlaying: boolean;
    isPaused: boolean;
    volume: number;
    loopMode: LoopMode;
    currentTrack: QueueTrack | null;
    position: number;
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
    images?: Array<{
        url: string;
    }>;
    product?: string;
}
export interface SocketEvents {
    'player:update': PlayerState;
    'queue:update': QueueState;
    'track:start': QueueTrack;
    'track:end': QueueTrack;
    'player:error': {
        guildId: string;
        message: string;
    };
    'join:guild': {
        guildId: string;
    };
    'leave:guild': {
        guildId: string;
    };
}
//# sourceMappingURL=index.d.ts.map