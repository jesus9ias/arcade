// Input-validation error codes.

export const VALIDATION_ERROR = {
  INVALID_VALUE: 'invalid_value',
  NOT_JSON: 'not_json',
  NOT_ARRAY: 'not_array',
} as const;
export type ValidationError =
  (typeof VALIDATION_ERROR)[keyof typeof VALIDATION_ERROR];
