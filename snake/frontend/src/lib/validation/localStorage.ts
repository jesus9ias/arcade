// Validation for persisted localStorage values. Anything that fails the schema
// is rejected (prefs) or discarded record-by-record (history), so tampered or
// outdated data can never reach game logic untyped.

import {
  Theme,
  Language,
  GameMode,
  SNAKE_ID,
  VALIDATION_ERROR,
} from '../constants';
import type { Theme as ThemeValue, Language as LanguageValue, GameMode as GameModeValue } from '../constants';
import type { GameRecord } from '../history/history';
import type { ValidationResult } from './result';

export interface Prefs {
  language: LanguageValue;
  theme: ThemeValue;
  mode: GameModeValue;
}

/** Returns the parsed value, or undefined if a string is not valid JSON. */
function parseMaybeJson(input: unknown): unknown {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }
  return input;
}

const isLanguage = (v: unknown): v is LanguageValue =>
  v === Language.EN || v === Language.ES;

const isTheme = (v: unknown): v is ThemeValue =>
  v === Theme.LIGHT || v === Theme.DARK;

// Only modes the player can actually be in are valid in stored prefs.
const isSelectableMode = (v: unknown): v is GameModeValue =>
  v === GameMode.SIMPLE || v === GameMode.VERSUS;

export function validatePrefs(input: unknown): ValidationResult<Prefs> {
  const parsed = parseMaybeJson(input);
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: VALIDATION_ERROR.NOT_JSON };
  }
  const v = parsed as Record<string, unknown>;
  if (!isLanguage(v.language) || !isTheme(v.theme) || !isSelectableMode(v.mode)) {
    return { ok: false, error: VALIDATION_ERROR.INVALID_VALUE };
  }
  return { ok: true, value: { language: v.language, theme: v.theme, mode: v.mode } };
}

function isValidRecord(value: unknown): value is GameRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length === 0) return false;
  if (typeof r.date !== 'string' || Number.isNaN(Date.parse(r.date))) return false;
  if (r.mode !== GameMode.SIMPLE && r.mode !== GameMode.VERSUS) return false;
  if (typeof r.level !== 'number') return false;
  if (typeof r.playerScore !== 'number') return false;
  if (r.mode === GameMode.VERSUS) {
    if (typeof r.machineScore !== 'number') return false;
    const okSurvivor =
      r.survivor === SNAKE_ID.PLAYER ||
      r.survivor === SNAKE_ID.MACHINE ||
      r.survivor === null;
    if (!okSurvivor) return false;
  }
  return true;
}

export function validateHistory(input: unknown): ValidationResult<GameRecord[]> {
  const parsed = parseMaybeJson(input);
  if (!Array.isArray(parsed)) {
    return { ok: false, error: VALIDATION_ERROR.NOT_ARRAY };
  }
  // Discard individually invalid records; keep the valid ones.
  return { ok: true, value: parsed.filter(isValidRecord) };
}
