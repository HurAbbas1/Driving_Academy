import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';
import pt from '../locales/pt.json';

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
  pt: { translation: pt },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    compatibilityJSON: 'v3' as any, // Required for React Native compatibility with older devices/engines
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

export default i18n;
