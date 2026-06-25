// Pure level math: regular fruits required and tick interval per level.

import {
  BASE_FRUITS_REQUIRED,
  MIN_FRUITS_REQUIRED,
  FRUITS_DECAY,
  BASE_SPEED_MS,
  SPEED_GROWTH,
} from '../constants';

/** Regular fruits required to clear a level (decreases ~10%/level to a floor). */
export function fruitsRequired(level: number): number {
  const raw = BASE_FRUITS_REQUIRED * FRUITS_DECAY ** (level - 1);
  return Math.max(MIN_FRUITS_REQUIRED, Math.round(raw));
}

/** Normal tick interval in ms for a level (shortens ~10%/level → faster). */
export function speedForLevel(level: number): number {
  return Math.round(BASE_SPEED_MS / SPEED_GROWTH ** (level - 1));
}
