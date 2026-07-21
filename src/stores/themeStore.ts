import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: 'light' | 'dark';
  hasUserToggledTheme: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
  resetUserToggledFlag: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Default to Dark Mode as per logo design guidelines
  hasUserToggledTheme: false,
  setTheme: async (theme) => {
    set({ theme, hasUserToggledTheme: true });
    await AsyncStorage.setItem('user-theme', theme);
  },
  toggleTheme: async () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme, hasUserToggledTheme: true });
    await AsyncStorage.setItem('user-theme', newTheme);
  },
  resetUserToggledFlag: () => set({ hasUserToggledTheme: false }),
  loadTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('user-theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        set({ theme: storedTheme });
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  },
}));
