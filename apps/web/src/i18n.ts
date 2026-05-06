import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';
import fr from './locales/fr/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ja', 'fr'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
