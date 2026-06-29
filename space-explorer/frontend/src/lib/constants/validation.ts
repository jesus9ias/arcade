// Validation error codes for persisted-value parsing.

export const VALIDATION_ERROR = {
  NOT_JSON: 'NOT_JSON',
  NOT_ARRAY: 'NOT_ARRAY',
  INVALID_VALUE: 'INVALID_VALUE',
} as const;
export type ValidationError = (typeof VALIDATION_ERROR)[keyof typeof VALIDATION_ERROR];
