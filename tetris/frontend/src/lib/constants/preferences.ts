// User preferences shape and defaults. Dark-only game: no theme preference.

import { MIN_LEVEL } from './levels';

export type Language = 'en' | 'es';

export interface Prefs {
  language: Language;
  muted: boolean;
  startLevel: number; // clamped to [MIN_LEVEL, MAX_LEVEL]
}

export const DEFAULT_PREFS: Prefs = {
  language: 'en',
  muted: false,
  startLevel: MIN_LEVEL,
};
