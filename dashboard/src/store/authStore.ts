import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getUser();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.response?.data?.message || 'Authentication failed',
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    // Clear cookies via backend
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/logout`;
    set({ user: null, isAuthenticated: false });
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ isAuthenticated: true });
  },
}));
