import { describe, it, expect } from 'vitest';
import {
  levelGoal,
  totalCreditToComplete,
  lineCredit,
  backToBackCredit,
  gravityForLevel,
  applyProgress,
} from '../progression';

describe('T-PROG level progression', () => {
  it('T-PROG-01 the starting-level goal is the cumulative 5·N·(N+1)/2', () => {
    expect(levelGoal(1, 1)).toBe(5);
    expect(levelGoal(3, 3)).toBe(30);
  });

  it('T-PROG-02 subsequent levels require 5·L', () => {
    expect(levelGoal(4, 3)).toBe(20);
    expect(levelGoal(5, 3)).toBe(25);
  });

  it('T-PROG-03 the line-credit table maps actions to credited lines', () => {
    expect(lineCredit(1, 'none')).toBe(1); // Single
    expect(lineCredit(2, 'none')).toBe(3); // Double
    expect(lineCredit(3, 'none')).toBe(5); // Triple
    expect(lineCredit(4, 'none')).toBe(8); // Tetris
    expect(lineCredit(0, 'mini')).toBe(1); // Mini T-Spin (no clear)
    expect(lineCredit(1, 'mini')).toBe(2); // Mini T-Spin Single
    expect(lineCredit(0, 'full')).toBe(4); // T-Spin (no clear)
    expect(lineCredit(1, 'full')).toBe(8); // T-Spin Single
    expect(lineCredit(2, 'full')).toBe(12); // T-Spin Double
    expect(lineCredit(3, 'full')).toBe(16); // T-Spin Triple
  });

  it('T-PROG-04 back-to-back credits half the action credit', () => {
    expect(backToBackCredit(8)).toBe(4);
  });

  it('T-PROG-05 reaching the goal increments the level and its gravity', () => {
    const r = applyProgress({ level: 1, credited: 4, startLevel: 1 }, 1);
    expect(r.level).toBe(2);
    expect(gravityForLevel(2)).toBe(0.793);
  });

  it('T-PROG-06 the cumulative credit to finish level 15 is 600 from any start', () => {
    for (let n = 1; n <= 15; n++) {
      expect(totalCreditToComplete(n)).toBe(600);
    }
  });
});
