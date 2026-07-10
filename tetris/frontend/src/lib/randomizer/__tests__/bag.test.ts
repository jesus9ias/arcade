import { describe, it, expect } from 'vitest';
import { createBag, draw } from '../bag';
import type { TetriminoType } from '../../engine/piece';

const ALL: TetriminoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const rng = () => 0.42; // deterministic

describe('T-BAG 7-bag randomizer', () => {
  it('T-BAG-01 a bag contains all seven tetriminos exactly once', () => {
    const bag = createBag(rng);
    expect(bag.length).toBe(7);
    expect(new Set(bag)).toEqual(new Set(ALL));
  });

  it('T-BAG-02 a new bag is drawn only when the current one empties', () => {
    let bag = createBag(rng);
    const drawn: TetriminoType[] = [];
    for (let i = 0; i < 7; i++) {
      const res = draw(bag, rng);
      drawn.push(res.piece);
      bag = res.bag;
    }
    expect(new Set(drawn)).toEqual(new Set(ALL)); // all seven, no repeats within the bag
    expect(bag.length).toBe(0);

    const eighth = draw(bag, rng); // forces a refill
    expect(ALL).toContain(eighth.piece);
    expect(eighth.bag.length).toBe(6);
  });
});
