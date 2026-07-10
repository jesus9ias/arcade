// Level bounds, gravity table and line-goal step. Single source of truth.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 15;

// Lines added to each level's requirement (level L requires 5·L; the starting
// level absorbs the cumulative total).
export const LINES_PER_LEVEL_STEP = 5;

// Gravity in seconds-per-row, indexed 1..15 (index 0 is padding).
export const GRAVITY_TABLE: number[] = [
  0, // unused
  1.0, // 1
  0.793, // 2
  0.618, // 3
  0.473, // 4
  0.355, // 5
  0.262, // 6
  0.19, // 7
  0.135, // 8
  0.094, // 9
  0.064, // 10
  0.043, // 11
  0.028, // 12
  0.018, // 13
  0.011, // 14
  0.007, // 15
];
