import { create } from 'zustand';

interface AuthUser {
  id: string;
  githubUsername: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setIsLoading: (loading: boolean) => void;
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.user) {
        set({ user: data.user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      set({ user: null });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
}));
