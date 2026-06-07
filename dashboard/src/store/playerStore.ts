import { create } from 'zustand';
import { PlayerState, LoopMode } from '../types';
import { api } from '../services/api';

interface PlayerStoreState {
  player: PlayerState | null;
  isLoading: boolean;
  error: string | null;
  fetchPlayerState: (guildId: string) => Promise<void>;
  playTrack: (guildId: string, query: string) => Promise<void>;
  togglePlay: (guildId: string) => Promise<void>;
  skipTrack: (guildId: string) => Promise<void>;
  stopPlayer: (guildId: string) => Promise<void>;
  changeVolume: (guildId: string, volume: number) => Promise<void>;
  setLoopMode: (guildId: string, mode: LoopMode) => Promise<void>;
  setPlayerState: (state: PlayerState) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  player: null,
  isLoading: false,
  error: null,

  fetchPlayerState: async (guildId) => {
    set({ isLoading: true });
    try {
      const res = await api.getPlayerState(guildId);
      set({ player: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  playTrack: async (guildId, query) => {
    try {
      await api.play(guildId, query);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to play track' });
    }
  },

  togglePlay: async (guildId) => {
    const { player } = get();
    if (!player) return;

    try {
      if (player.isPlaying && !player.isPaused) {
        await api.pause(guildId);
        set({ player: { ...player, isPaused: true } });
      } else {
        await api.resume(guildId);
        set({ player: { ...player, isPaused: false, isPlaying: true } });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  skipTrack: async (guildId) => {
    try {
      await api.skip(guildId);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  stopPlayer: async (guildId) => {
    try {
      await api.stop(guildId);
      set({ player: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  changeVolume: async (guildId, volume) => {
    const { player } = get();
    if (!player) return;
    try {
      await api.volume(guildId, volume);
      set({ player: { ...player, volume } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setLoopMode: async (guildId, mode) => {
    const { player } = get();
    if (!player) return;
    try {
      await api.loop(guildId, mode);
      set({ player: { ...player, loopMode: mode } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setPlayerState: (state) => {
    set({ player: state });
  },
}));
