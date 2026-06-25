import { DRAW, GameMode, MEME_CATEGORY } from '../constants';
import type { MemeCategory, PlayerSymbol, Winner } from '../constants';

export interface MemeCatalog {
  win: string[];
  lose: string[];
  neutral: string[];
}

export interface MemeOutcome {
  winner: Winner;
  humanSymbol: PlayerSymbol;
  mode: GameMode;
}

/**
 * Resolves the meme category for a finished game:
 * HVH and draws are always neutral; in HVM a human win is "win" and a machine
 * win is "lose".
 */
export function getMemeCategory(outcome: MemeOutcome): MemeCategory {
  if (outcome.mode === GameMode.HVH) return MEME_CATEGORY.NEUTRAL;
  if (outcome.winner === DRAW) return MEME_CATEGORY.NEUTRAL;
  if (outcome.winner === outcome.humanSymbol) return MEME_CATEGORY.WIN;
  return MEME_CATEGORY.LOSE;
}

/** Picks a random filename from the category, or null if it has none. */
export function pickRandomMeme(
  catalog: MemeCatalog,
  category: MemeCategory,
): string | null {
  const options = catalog[category];
  if (!options || options.length === 0) return null;
  const index = Math.floor(Math.random() * options.length);
  return options[index] ?? null;
}
