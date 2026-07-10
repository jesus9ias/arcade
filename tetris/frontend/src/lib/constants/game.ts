// Core board / timing constants. No magic values elsewhere.

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const BUFFER_HEIGHT = 2; // hidden spawn rows above the visible field
export const TOTAL_HEIGHT = VISIBLE_HEIGHT + BUFFER_HEIGHT;

export const NEXT_QUEUE_SIZE = 5; // upcoming pieces shown (design mock)
export const MAX_HOLDS = 10; // hold uses allowed per run

// Lock delay (Game Rules → Lock delay).
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

// Soft drop falls this many times faster than the level's gravity.
export const SOFT_DROP_FACTOR = 20;
// Effective seconds-per-row for a hard drop (near-instant).
export const HARD_DROP_INTERVAL = 0.0001;
