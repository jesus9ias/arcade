import { describe, it, expect } from 'vitest';
import { getMemeCategory, pickRandomMeme } from '../memes';
import { GameMode } from '../../constants';

// Stage 2 failing tests — lib/memes (T-MEME-*). Implementation arrives in Stage 3.

describe('lib/memes — getMemeCategory', () => {
  it('T-MEME-01: returns "win" for a human win in HVM', () => {
    expect(
      getMemeCategory({ winner: 'X', humanSymbol: 'X', mode: GameMode.HVM }),
    ).toBe('win');
  });

  it('T-MEME-02: returns "lose" for a machine win in HVM', () => {
    expect(
      getMemeCategory({ winner: 'O', humanSymbol: 'X', mode: GameMode.HVM }),
    ).toBe('lose');
  });

  it('T-MEME-03: returns "neutral" for a draw in HVM', () => {
    expect(
      getMemeCategory({ winner: 'DRAW', humanSymbol: 'X', mode: GameMode.HVM }),
    ).toBe('neutral');
  });

  it('T-MEME-04: returns "neutral" for any HVH result', () => {
    expect(
      getMemeCategory({ winner: 'X', humanSymbol: 'X', mode: GameMode.HVH }),
    ).toBe('neutral');
  });
});

describe('lib/memes — pickRandomMeme', () => {
  it('T-MEME-05: returns a filename from the requested category', () => {
    const catalog = { win: ['a.jpg', 'b.jpg'], lose: [], neutral: [] };
    expect(['a.jpg', 'b.jpg']).toContain(pickRandomMeme(catalog, 'win'));
  });

  it('T-MEME-06: returns null for an empty category', () => {
    const catalog = { win: [], lose: [], neutral: [] };
    expect(pickRandomMeme(catalog, 'win')).toBeNull();
  });
});
