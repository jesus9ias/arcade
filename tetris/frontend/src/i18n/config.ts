// i18next setup. Exports the raw dictionaries (for tests) and an initialized
// instance for react-i18next.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';
import type { Language } from '../lib/constants/preferences';

export { en, es };

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es'];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
