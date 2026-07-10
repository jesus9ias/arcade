// 7-bag randomizer. Isolated so it can later be seeded for multiplayer shared
// sequences (see spec → Future Considerations). rng defaults to Math.random and
// is injectable for deterministic tests.

import { TETRIMINO_TYPES } from '../constants/pieces';
import type { TetriminoType } from '../engine/piece';

export type BagState = TetriminoType[];

export function createBag(rng: () => number = Math.random): BagState {
  const bag = [...TETRIMINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Draw the next piece, refilling the bag first if it is empty.
export function draw(
  bag: BagState,
  rng: () => number = Math.random,
): { piece: TetriminoType; bag: BagState } {
  const source = bag.length > 0 ? bag : createBag(rng);
  const [piece, ...rest] = source;
  return { piece, bag: rest };
}
