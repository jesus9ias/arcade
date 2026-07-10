import { describe, it, expect } from 'vitest';
import {
  getActionTotal,
  getComboPoints,
  getPerfectClearPoints,
  softDropPoints,
  hardDropPoints,
  isDifficultClear,
  scorePlacement,
} from '../scoring';

describe('T-SCORE scoring', () => {
  it('T-SCORE-01 line clears scale with the level', () => {
    expect(getActionTotal(1, 'none', 1)).toBe(100);
    expect(getActionTotal(2, 'none', 3)).toBe(900);
    expect(getActionTotal(3, 'none', 1)).toBe(500);
    expect(getActionTotal(4, 'none', 2)).toBe(1600);
  });

  it('T-SCORE-02 T-Spin variants scale with the level', () => {
    expect(getActionTotal(0, 'full', 1)).toBe(400);
    expect(getActionTotal(1, 'full', 2)).toBe(1600);
    expect(getActionTotal(2, 'full', 1)).toBe(1200);
    expect(getActionTotal(3, 'full', 1)).toBe(1600);
    expect(getActionTotal(0, 'mini', 1)).toBe(100);
    expect(getActionTotal(1, 'mini', 3)).toBe(600);
  });

  it('T-SCORE-03 soft and hard drop points', () => {
    expect(softDropPoints(4)).toBe(4);
    expect(hardDropPoints(8)).toBe(16);
  });

  it('T-SCORE-04 back-to-back adds 0.5x the action total for difficult clears only', () => {
    expect(isDifficultClear(4, 'none')).toBe(true); // Tetris
    expect(isDifficultClear(2, 'none')).toBe(false); // Double
    expect(isDifficultClear(1, 'full')).toBe(true); // T-Spin Single
    expect(isDifficultClear(1, 'mini')).toBe(true); // Mini T-Spin Single
    const base = getActionTotal(4, 'none', 2); // 1600
    const p = scorePlacement({
      lines: 4,
      spin: 'none',
      level: 2,
      backToBack: true,
      combo: 0,
      perfectClear: false,
      softDropCells: 0,
      hardDropCells: 0,
    });
    expect(p.bonus).toBe(base * 0.5); // B2B increment is a bonus
    expect(p.regular).toBe(base); // Tetris base is a regular line clear
    expect(p.total).toBe(base * 1.5);
  });

  it('T-SCORE-05 combo points = 50 x combo x level', () => {
    expect(getComboPoints(3, 2)).toBe(300);
  });

  it('T-SCORE-06 perfect clear bonuses', () => {
    expect(getPerfectClearPoints(1, false, 1)).toBe(800);
    expect(getPerfectClearPoints(2, false, 1)).toBe(1200);
    expect(getPerfectClearPoints(3, false, 1)).toBe(1800);
    expect(getPerfectClearPoints(4, false, 1)).toBe(2000);
    expect(getPerfectClearPoints(4, true, 1)).toBe(3200); // B2B Tetris PC
  });

  it('T-SCORE-07 regular/bonus split is recorded correctly', () => {
    const at = getActionTotal(2, 'full', 1); // 1200 → all bonus (a T-Spin)
    const p = scorePlacement({
      lines: 2,
      spin: 'full',
      level: 1,
      backToBack: true,
      combo: 2,
      perfectClear: false,
      softDropCells: 3,
      hardDropCells: 0,
    });
    expect(p.regular).toBe(3); // only the soft drop is "regular"
    expect(p.bonus).toBe(at + at * 0.5 + getComboPoints(2, 1)); // 1200 + 600 + 100
    expect(p.total).toBe(p.regular + p.bonus);
  });
});
