// User-preference enums and defaults.

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const Language = {
  EN: 'en',
  ES: 'es',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const SUPPORTED_LANGUAGES: ReadonlyArray<Language> = [Language.EN, Language.ES];
export const SUPPORTED_THEMES: ReadonlyArray<Theme> = [Theme.LIGHT, Theme.DARK];

export interface Prefs {
  language: Language;
  theme: Theme;
}

/** Fallback used when no valid stored preference and no system signal exists. */
export const DEFAULT_PREFS: Prefs = {
  language: Language.EN,
  theme: Theme.DARK,
};
