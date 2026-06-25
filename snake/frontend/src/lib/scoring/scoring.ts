// Pure scoring: time-decay factor and final fruit points.

import { DECAY_FLOOR, DECAY_WINDOW_TICKS } from '../constants';

/**
 * Fraction of a fruit's base value given how many ticks it has been on the
 * board. Decays linearly from 1.0 at spawn to DECAY_FLOOR at the end of the
 * window, then stays at the floor. Never returns zero.
 */
export function decayFactor(ticksElapsed: number): number {
  const raw = 1 - (1 - DECAY_FLOOR) * (ticksElapsed / DECAY_WINDOW_TICKS);
  return Math.max(DECAY_FLOOR, raw);
}

/**
 * Points awarded for eating a fruit: base × decay × multiplier, rounded.
 * A bonus (golden) fruit ignores decay and is always worth base × multiplier.
 */
export function fruitPoints(
  baseValue: number,
  ticksElapsed: number,
  multiplier: number,
  isBonus = false,
): number {
  const factor = isBonus ? 1 : decayFactor(ticksElapsed);
  return Math.round(baseValue * factor * multiplier);
}
