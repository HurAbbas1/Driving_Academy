import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  email: string;
  displayName: string;
  language: 'en' | 'ja' | 'zh' | 'pt';
  theme: 'dark' | 'light';
  createdAt: any;
  lastActive: any;
  streak: {
    current: number;
    longest: number;
    lastDate: string | null;
  };
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  logout: () => set({ user: null, profile: null }),
}));
