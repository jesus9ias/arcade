import { describe, it, expect } from 'vitest';
import { decayFactor, fruitPoints } from '../scoring';
import { DECAY_WINDOW_TICKS, DECAY_FLOOR, GOLDEN_BASE_VALUE } from '../../constants';

// Stage 2 failing tests — scoring (T-SCORE-*). Implementation arrives in Stage 3.

describe('scoring — decayFactor', () => {
  it('T-SCORE-01: a fruit is worth full value at its spawn tick', () => {
    expect(decayFactor(0)).toBe(1);
  });

  it('T-SCORE-02: the factor reaches the floor at the end of the decay window', () => {
    expect(decayFactor(DECAY_WINDOW_TICKS)).toBeCloseTo(DECAY_FLOOR, 10);
  });

  it('T-SCORE-03: the factor never drops below the floor', () => {
    expect(decayFactor(DECAY_WINDOW_TICKS * 2)).toBe(DECAY_FLOOR);
  });
});

describe('scoring — fruitPoints', () => {
  it('T-SCORE-04: points are base × decay × multiplier, rounded', () => {
    expect(fruitPoints(10, 0, 1)).toBe(10);
  });

  it('T-SCORE-05: the versus multiplier applies', () => {
    expect(fruitPoints(10, 0, 1.5)).toBe(15);
  });

  it('T-SCORE-06: a bonus (golden) fruit ignores decay', () => {
    expect(fruitPoints(GOLDEN_BASE_VALUE, DECAY_WINDOW_TICKS * 2, 1, true)).toBe(
      GOLDEN_BASE_VALUE,
    );
  });
});
