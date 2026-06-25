import { describe, it, expect } from 'vitest';
import { rotate, move } from '../direction';
import type { Position } from '../../constants';

// Stage 2 failing tests — engine/direction (T-DIR-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });

describe('engine/direction', () => {
  it('T-DIR-01: clockwise rotation cycles UP → RIGHT → DOWN → LEFT → UP', () => {
    expect(rotate('UP', 'CW')).toBe('RIGHT');
    expect(rotate('RIGHT', 'CW')).toBe('DOWN');
    expect(rotate('DOWN', 'CW')).toBe('LEFT');
    expect(rotate('LEFT', 'CW')).toBe('UP');
  });

  it('T-DIR-02: counter-clockwise rotation cycles the other way', () => {
    expect(rotate('UP', 'CCW')).toBe('LEFT');
    expect(rotate('LEFT', 'CCW')).toBe('DOWN');
    expect(rotate('DOWN', 'CCW')).toBe('RIGHT');
    expect(rotate('RIGHT', 'CCW')).toBe('UP');
  });

  it('T-DIR-03: move advances a position by one cell in a direction', () => {
    expect(move(P(5, 5), 'RIGHT')).toEqual(P(6, 5));
    expect(move(P(5, 5), 'LEFT')).toEqual(P(4, 5));
    expect(move(P(5, 5), 'UP')).toEqual(P(5, 4));
    expect(move(P(5, 5), 'DOWN')).toEqual(P(5, 6));
  });
});
