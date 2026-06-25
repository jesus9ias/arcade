import { describe, it, expect } from 'vitest';
import { updateStreak } from '../efficiency';

// Stage 2 failing tests — scoring/efficiency (T-EFF-*). Implementation arrives in Stage 3.

describe('scoring/efficiency — updateStreak', () => {
  it('T-EFF-01: eating a regular fruit above the threshold increments the streak', () => {
    expect(updateStreak(1, 0.7, false)).toEqual({ streak: 2, spawnBonus: false });
  });

  it('T-EFF-02: eating a regular fruit at or below the threshold resets the streak', () => {
    expect(updateStreak(2, 0.6, false)).toEqual({ streak: 0, spawnBonus: false });
  });

  it('T-EFF-03: reaching three spawns a golden fruit and resets the streak', () => {
    expect(updateStreak(2, 0.7, false)).toEqual({ streak: 0, spawnBonus: true });
  });

  it('T-EFF-04: a golden fruit does not change the streak', () => {
    expect(updateStreak(1, 1, true)).toEqual({ streak: 1, spawnBonus: false });
  });
});
