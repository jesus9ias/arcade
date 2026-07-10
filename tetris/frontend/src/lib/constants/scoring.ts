// Scoring and line-credit tables. All point values are multiplied by the current
// level unless noted; drop points are not. Tunable in one place.

import type { SpinResult } from '../scoring/tspin';

// Base action points (level 1) keyed by spin then line count.
export const ACTION_POINTS: Record<SpinResult, Record<number, number>> = {
  none: { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 },
  mini: { 0: 100, 1: 200, 2: 200 },
  full: { 0: 400, 1: 800, 2: 1200, 3: 1600 },
};

export const SOFT_DROP_POINTS_PER_CELL = 1;
export const HARD_DROP_POINTS_PER_CELL = 2;

export const COMBO_POINTS_PER_LEVEL = 50; // × combo × level
export const BACK_TO_BACK_MULTIPLIER = 0.5; // × action total (and × credited lines)

// Perfect Clear (All Clear) base points (level 1) keyed by line count; a B2B
// Tetris perfect clear is a special higher value.
export const PERFECT_CLEAR_POINTS: Record<number, number> = { 1: 800, 2: 1200, 3: 1800, 4: 2000 };
export const PERFECT_CLEAR_B2B_TETRIS_POINTS = 3200;

// Credited lines toward the level goal, keyed by spin then line count.
export const LINE_CREDIT: Record<SpinResult, Record<number, number>> = {
  none: { 0: 0, 1: 1, 2: 3, 3: 5, 4: 8 },
  mini: { 0: 1, 1: 2 },
  full: { 0: 4, 1: 8, 2: 12, 3: 16 },
};
