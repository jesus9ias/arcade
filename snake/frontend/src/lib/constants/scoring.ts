// Scoring, fruit-value, decay, efficiency, and survivor-bonus constants.

import { FruitType } from './game';
import type { FruitType as FruitTypeValue } from './game';

/** Base point value per regular fruit type. */
export const FRUIT_BASE_VALUE: Record<FruitTypeValue, number> = {
  [FruitType.CHERRY]: 5,
  [FruitType.APPLE]: 10,
  [FruitType.ORANGE]: 15,
  [FruitType.WATERMELON]: 25,
};

/** Relative spawn weight per regular fruit type (lower value = more common). */
export const FRUIT_SPAWN_WEIGHT: Record<FruitTypeValue, number> = {
  [FruitType.CHERRY]: 40,
  [FruitType.APPLE]: 30,
  [FruitType.ORANGE]: 20,
  [FruitType.WATERMELON]: 10,
};

/** Base value of a golden bonus fruit (does not decay). */
export const GOLDEN_BASE_VALUE = 20;

/** Lowest fraction of base value a decaying fruit can be worth (never zero). */
export const DECAY_FLOOR = 0.1;
/** Ticks over which a fruit decays from full value to the floor. */
export const DECAY_WINDOW_TICKS = 70;

/** Per-mode point multiplier applied to every fruit. */
export const SIMPLE_MULTIPLIER = 1;
export const VERSUS_MULTIPLIER = 1.5;

/** Efficiency streak: regular fruits eaten above this fraction count toward it. */
export const EFFICIENCY_THRESHOLD = 0.6;
/** Consecutive efficient fruits that spawn a golden bonus fruit. */
export const EFFICIENCY_STREAK = 3;

/** The surviving snake's score is multiplied by this when the other dies (Versus). */
export const SURVIVOR_BONUS = 1.5;
