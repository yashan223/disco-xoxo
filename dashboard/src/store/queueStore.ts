import { create } from 'zustand';
import { QueueState, QueueTrack } from '../types';
import { api } from '../services/api';

interface QueueStoreState {
  queue: QueueState | null;
  isLoading: boolean;
  error: string | null;
  fetchQueue: (guildId: string) => Promise<void>;
  removeItem: (guildId: string, queueId: string) => Promise<void>;
  moveItem: (guildId: string, fromIndex: number, toIndex: number) => Promise<void>;
  clearItems: (guildId: string) => Promise<void>;
  setQueueState: (state: QueueState) => void;
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
  queue: null,
  isLoading: false,
  error: null,

  fetchQueue: async (guildId) => {
    set({ isLoading: true });
    try {
      const res = await api.getQueue(guildId);
      set({ queue: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  removeItem: async (guildId, queueId) => {
    try {
      await api.removeTrack(guildId, queueId);
      const { queue } = get();
      if (queue) {
        const updatedTracks = queue.tracks.filter((t) => t.queueId !== queueId);
        set({ queue: { ...queue, tracks: updatedTracks, total: updatedTracks.length } });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  moveItem: async (guildId, fromIndex, toIndex) => {
    try {
      // Optimistic update
      const { queue } = get();
      if (queue) {
        const newTracks = [...queue.tracks];
        const [movedTrack] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, movedTrack);
        set({ queue: { ...queue, tracks: newTracks } });
      }

      await api.moveTrack(guildId, fromIndex, toIndex);
    } catch (err: any) {
      set({ error: err.message });
      // Re-fetch to sync if failed
      get().fetchQueue(guildId);
    }
  },

  clearItems: async (guildId) => {
    try {
      await api.clearQueue(guildId);
      set({ queue: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setQueueState: (state) => {
    set({ queue: state });
  },
}));
