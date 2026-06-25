// User-preference constants: theme, language, and default game mode.

import { GameMode } from './game';

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
export const DEFAULT_MODE: GameMode = GameMode.SIMPLE;
