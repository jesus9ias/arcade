// Level-progression and speed constants.

/** Regular fruits required to clear level 1; decreases each level to a floor. */
export const BASE_FRUITS_REQUIRED = 12;
export const MIN_FRUITS_REQUIRED = 4;
/** Multiplicative decay of the requirement per level (−10%). */
export const FRUITS_DECAY = 0.9;

/** Tick interval (ms per cell) at level 1; shortens each level. */
export const BASE_SPEED_MS = 140;
/** Multiplicative speed growth per level (+10% faster → interval ÷ this). */
export const SPEED_GROWTH = 1.1;

/** Boost divides the current tick interval by this factor while toggled on. */
export const BOOST_FACTOR = 1.8;
