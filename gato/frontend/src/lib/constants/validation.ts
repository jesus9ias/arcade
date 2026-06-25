// Input-validation limits and error codes.

export const PLAYER_NAME_MIN_LENGTH = 1;
export const PLAYER_NAME_MAX_LENGTH = 30;

/** Characters disallowed in a player name (prevents HTML/script injection). */
export const PLAYER_NAME_FORBIDDEN_PATTERN = /[<>]/;

export const VALIDATION_ERROR = {
  EMPTY: 'empty',
  TOO_LONG: 'too_long',
  INVALID_CHARS: 'invalid_chars',
  INVALID_VALUE: 'invalid_value',
  NOT_JSON: 'not_json',
  NOT_ARRAY: 'not_array',
} as const;
export type ValidationError =
  (typeof VALIDATION_ERROR)[keyof typeof VALIDATION_ERROR];
