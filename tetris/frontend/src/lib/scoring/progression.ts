// Level progression via credited lines. The starting level absorbs the
// cumulative requirement; later levels require 5·L. Total to finish level 15 is
// always 600, independent of the starting level.

import { GRAVITY_TABLE, LINES_PER_LEVEL_STEP, MAX_LEVEL, MIN_LEVEL } from '../constants/levels';
import { BACK_TO_BACK_MULTIPLIER, LINE_CREDIT } from '../constants/scoring';
import type { SpinResult } from './tspin';

// Credited lines required to complete `level` in a run started at `startLevel`.
export function levelGoal(level: number, startLevel: number): number {
  if (level === startLevel) {
    return (LINES_PER_LEVEL_STEP * startLevel * (startLevel + 1)) / 2;
  }
  return LINES_PER_LEVEL_STEP * level;
}

// Sum of every level's goal from the starting level through level 15.
export function totalCreditToComplete(startLevel: number): number {
  let total = 0;
  for (let level = startLevel; level <= MAX_LEVEL; level++) {
    total += levelGoal(level, startLevel);
  }
  return total;
}

export function lineCredit(lines: number, spin: SpinResult): number {
  return LINE_CREDIT[spin][lines] ?? 0;
}

export function backToBackCredit(baseCredit: number): number {
  return baseCredit * BACK_TO_BACK_MULTIPLIER;
}

export function gravityForLevel(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
  return GRAVITY_TABLE[clamped];
}

export interface ProgressState {
  level: number;
  credited: number;
  startLevel: number;
}

export interface ProgressResult {
  level: number;
  credited: number;
  completed: boolean; // level 15 finished (cumulative goal reached)
}

// Add credit, levelling up (carrying the remainder) while the goal is met.
export function applyProgress(state: ProgressState, added: number): ProgressResult {
  let level = state.level;
  let credited = state.credited + added;

  while (level <= MAX_LEVEL) {
    const goal = levelGoal(level, state.startLevel);
    if (credited < goal) break;
    if (level === MAX_LEVEL) {
      return { level, credited, completed: true };
    }
    credited -= goal;
    level += 1;
  }

  return { level, credited, completed: false };
}
