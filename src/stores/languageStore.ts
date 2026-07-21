import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../services/i18n';

export type LanguageCode = 'en' | 'ja' | 'zh' | 'pt';

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: async (lang) => {
    set({ language: lang });
    await AsyncStorage.setItem('user-language', lang);
    await i18n.changeLanguage(lang);
  },
  loadLanguage: async () => {
    try {
      const storedLang = await AsyncStorage.getItem('user-language');
      if (storedLang) {
        const langCode = storedLang as LanguageCode;
        set({ language: langCode });
        await i18n.changeLanguage(langCode);
      }
    } catch (e) {
      console.error('Failed to load language preference', e);
    }
  },
}));
