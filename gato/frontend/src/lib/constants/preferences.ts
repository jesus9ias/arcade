// User-preference constants: theme and language.

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

export const DEFAULT_THEME: Theme = Theme.LIGHT;
export const DEFAULT_LANGUAGE: Language = Language.EN;
