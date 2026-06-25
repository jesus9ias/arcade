import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Language } from '../lib/constants';
import type { Language as LanguageType } from '../lib/constants';
import enJson from './en.json';
import esJson from './es.json';

export const en = enJson as Record<string, string>;
export const es = esJson as Record<string, string>;

function detectInitialLanguage(): LanguageType {
  if (
    typeof navigator !== 'undefined' &&
    navigator.language?.toLowerCase().startsWith(Language.ES)
  ) {
    return Language.ES;
  }
  return Language.EN;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: detectInitialLanguage(),
    fallbackLng: Language.EN,
    // Keys are flat, dotted strings (e.g. "game.title"); disable nesting.
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
  });
}

export default i18n;
