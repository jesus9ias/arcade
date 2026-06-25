import {
  PLAYER_NAME_FORBIDDEN_PATTERN,
  PLAYER_NAME_MAX_LENGTH,
  VALIDATION_ERROR,
} from '../constants';
import type { ValidationResult } from './result';

/** Validates and trims a player name. */
export function validatePlayerName(raw: string): ValidationResult<string> {
  const value = raw.trim();
  if (value.length === 0) {
    return { ok: false, error: VALIDATION_ERROR.EMPTY };
  }
  if (value.length > PLAYER_NAME_MAX_LENGTH) {
    return { ok: false, error: VALIDATION_ERROR.TOO_LONG };
  }
  if (PLAYER_NAME_FORBIDDEN_PATTERN.test(value)) {
    return { ok: false, error: VALIDATION_ERROR.INVALID_CHARS };
  }
  return { ok: true, value };
}
