// Point scoring. Line-clear action totals, drops, combo, back-to-back and
// perfect clear, plus the regular/bonus split stored in match history.

import {
  ACTION_POINTS,
  BACK_TO_BACK_MULTIPLIER,
  COMBO_POINTS_PER_LEVEL,
  HARD_DROP_POINTS_PER_CELL,
  PERFECT_CLEAR_B2B_TETRIS_POINTS,
  PERFECT_CLEAR_POINTS,
  SOFT_DROP_POINTS_PER_CELL,
} from '../constants/scoring';
import type { SpinResult } from './tspin';

// Base action total for a placement (× level; drops excluded).
export function getActionTotal(lines: number, spin: SpinResult, level: number): number {
  const base = ACTION_POINTS[spin][lines] ?? 0;
  return base * level;
}

export function getComboPoints(combo: number, level: number): number {
  return combo > 0 ? COMBO_POINTS_PER_LEVEL * combo * level : 0;
}

export function getPerfectClearPoints(lines: number, backToBack: boolean, level: number): number {
  if (lines === 4 && backToBack) return PERFECT_CLEAR_B2B_TETRIS_POINTS * level;
  return (PERFECT_CLEAR_POINTS[lines] ?? 0) * level;
}

export function softDropPoints(cells: number): number {
  return cells * SOFT_DROP_POINTS_PER_CELL;
}

export function hardDropPoints(cells: number): number {
  return cells * HARD_DROP_POINTS_PER_CELL;
}

// Difficult clears (Tetris, any T-Spin line clear, any Mini T-Spin line clear)
// sustain a back-to-back chain.
export function isDifficultClear(lines: number, spin: SpinResult): boolean {
  return (spin !== 'none' && lines > 0) || (spin === 'none' && lines === 4);
}

export interface PlacementInput {
  lines: number;
  spin: SpinResult;
  level: number;
  backToBack: boolean; // this clear continues a B2B chain
  combo: number; // consecutive line-clearing placements
  perfectClear: boolean;
  softDropCells: number;
  hardDropCells: number;
}

export interface PlacementScore {
  regular: number;
  bonus: number;
  total: number;
}

// Split: plain line clears (Single..Tetris base) and drops are "regular";
// T-Spin/Mini totals, the B2B increment, combo and perfect clear are "bonus".
export function scorePlacement(input: PlacementInput): PlacementScore {
  const actionTotal = getActionTotal(input.lines, input.spin, input.level);
  const lineBase = input.spin === 'none' ? actionTotal : 0;
  const spinBonus = input.spin !== 'none' ? actionTotal : 0;
  const b2bBonus = input.backToBack ? actionTotal * BACK_TO_BACK_MULTIPLIER : 0;
  const comboBonus = getComboPoints(input.combo, input.level);
  const perfectClearBonus = input.perfectClear
    ? getPerfectClearPoints(input.lines, input.backToBack, input.level)
    : 0;
  const drops = softDropPoints(input.softDropCells) + hardDropPoints(input.hardDropCells);

  const regular = lineBase + drops;
  const bonus = spinBonus + b2bBonus + comboBonus + perfectClearBonus;
  return { regular, bonus, total: regular + bonus };
}
