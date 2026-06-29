// Validation for persisted localStorage values. Prefs are rejected wholesale on
// any invalid field; progress records are discarded individually so one bad
// entry never wipes the rest. Tampered or outdated data never reaches game logic.

import { Theme, Language, VALIDATION_ERROR } from '../constants';
import type { Prefs } from '../constants';
import type { LevelProgress } from '../progress/progress';
import type { ValidationResult } from './result';

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

const isLanguage = (v: unknown): v is Prefs['language'] =>
  v === Language.EN || v === Language.ES;

const isTheme = (v: unknown): v is Prefs['theme'] => v === Theme.LIGHT || v === Theme.DARK;

export function validatePrefs(input: unknown): ValidationResult<Prefs> {
  const parsed = parseMaybeJson(input);
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: VALIDATION_ERROR.NOT_JSON };
  }
  const v = parsed as Record<string, unknown>;
  if (!isLanguage(v.language) || !isTheme(v.theme)) {
    return { ok: false, error: VALIDATION_ERROR.INVALID_VALUE };
  }
  return { ok: true, value: { language: v.language, theme: v.theme } };
}

function isValidProgressRecord(value: unknown): value is LevelProgress {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  if (typeof r.levelId !== 'number') return false;
  if (typeof r.completed !== 'boolean') return false;
  if (r.bestTimeMs !== null && typeof r.bestTimeMs !== 'number') return false;
  return true;
}

export function validateProgress(input: unknown): ValidationResult<LevelProgress[]> {
  const parsed = parseMaybeJson(input);
  if (!Array.isArray(parsed)) {
    return { ok: false, error: VALIDATION_ERROR.NOT_ARRAY };
  }
  // Discard individually invalid records; keep the valid ones.
  return { ok: true, value: parsed.filter(isValidProgressRecord) };
}
