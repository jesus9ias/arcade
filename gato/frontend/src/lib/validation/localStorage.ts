import {
  GameMode,
  Language,
  Theme,
  VALIDATION_ERROR,
} from '../constants';
import type {
  GameMode as GameModeType,
  Language as LanguageType,
  PlayerSymbol,
  Theme as ThemeType,
} from '../constants';
import type { MatchRecord } from '../history/history';
import type { ValidationResult } from './result';

export interface GatoPrefs {
  language: LanguageType;
  theme: ThemeType;
  mode?: GameModeType;
  playerOne?: string;
  playerTwo?: string;
  humanSymbol?: PlayerSymbol;
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

const isLanguage = (value: unknown): value is LanguageType =>
  value === Language.EN || value === Language.ES;
const isTheme = (value: unknown): value is ThemeType =>
  value === Theme.LIGHT || value === Theme.DARK;
const isMode = (value: unknown): value is GameModeType =>
  value === GameMode.HVM || value === GameMode.HVH;
const isSymbol = (value: unknown): value is PlayerSymbol =>
  value === 'X' || value === 'O';

/** Validates the `gato_prefs` value (object or JSON string). */
export function validatePrefs(input: unknown): ValidationResult<GatoPrefs> {
  const parsed = parseMaybeJson(input);
  if (parsed === null || typeof parsed !== 'object') {
    return { ok: false, error: VALIDATION_ERROR.NOT_JSON };
  }

  const candidate = parsed as Record<string, unknown>;
  if (!isLanguage(candidate.language) || !isTheme(candidate.theme)) {
    return { ok: false, error: VALIDATION_ERROR.INVALID_VALUE };
  }

  const prefs: GatoPrefs = {
    language: candidate.language,
    theme: candidate.theme,
  };
  if (isMode(candidate.mode)) prefs.mode = candidate.mode;
  if (typeof candidate.playerOne === 'string') prefs.playerOne = candidate.playerOne;
  if (typeof candidate.playerTwo === 'string') prefs.playerTwo = candidate.playerTwo;
  if (isSymbol(candidate.humanSymbol)) prefs.humanSymbol = candidate.humanSymbol;

  return { ok: true, value: prefs };
}

function isMatchRecord(value: unknown): value is MatchRecord {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.date === 'string' &&
    isMode(record.mode) &&
    typeof record.playerOne === 'string' &&
    typeof record.playerTwo === 'string' &&
    isSymbol(record.humanSymbol) &&
    (record.winner === 'X' || record.winner === 'O' || record.winner === 'DRAW') &&
    typeof record.winnerName === 'string' &&
    typeof record.turns === 'number'
  );
}

/**
 * Validates the `gato_history` value (array or JSON string). Invalid individual
 * records are discarded; a non-array value fails outright.
 */
export function validateHistory(input: unknown): ValidationResult<MatchRecord[]> {
  const parsed = parseMaybeJson(input);
  if (!Array.isArray(parsed)) {
    return { ok: false, error: VALIDATION_ERROR.NOT_ARRAY };
  }
  return { ok: true, value: parsed.filter(isMatchRecord) };
}
