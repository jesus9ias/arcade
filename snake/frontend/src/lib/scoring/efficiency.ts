// Pure efficiency-streak logic. Tracks consecutive regular fruits eaten above
// the efficiency threshold; reaching the streak length spawns a golden fruit.

import { EFFICIENCY_THRESHOLD, EFFICIENCY_STREAK } from '../constants';

export interface StreakResult {
  /** The streak after this fruit. */
  streak: number;
  /** Whether a golden bonus fruit should spawn this tick. */
  spawnBonus: boolean;
}

/**
 * Update the efficiency streak after eating a fruit.
 * @param streak  current consecutive-efficient count
 * @param decay   the fruit's decay factor (its fraction of base value)
 * @param isBonus whether the eaten fruit was a golden bonus fruit
 */
export function updateStreak(
  streak: number,
  decay: number,
  isBonus: boolean,
): StreakResult {
  // Golden fruits neither advance nor reset the streak.
  if (isBonus) return { streak, spawnBonus: false };

  if (decay > EFFICIENCY_THRESHOLD) {
    const next = streak + 1;
    if (next >= EFFICIENCY_STREAK) return { streak: 0, spawnBonus: true };
    return { streak: next, spawnBonus: false };
  }

  // A slow (low-value) fruit breaks the streak.
  return { streak: 0, spawnBonus: false };
}
