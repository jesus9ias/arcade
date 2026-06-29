import type { ValidationError } from '../constants';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ValidationError };
