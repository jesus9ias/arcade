import { describe, it, expect } from 'vitest';
import { rotate } from '../srs';
import { createBoard, isColliding } from '../../engine/board';
import { getAbsoluteCells } from '../../engine/piece';
import type { ActivePiece, TetriminoType, RotationState } from '../../engine/piece';

const P = (type: TetriminoType, rotation: RotationState, x: number, y: number): ActivePiece => ({
  type,
  rotation,
  x,
  y,
});

const inBounds = (p: ActivePiece, height: number) =>
  getAbsoluteCells(p).every((c) => c.x >= 0 && c.x < 10 && c.y >= 0 && c.y < height);

describe('T-ROT SRS rotation', () => {
  it('T-ROT-01 clockwise and counter-clockwise cycle the rotation states', () => {
    const b = createBoard();
    let p = P('T', 0, 4, 4);
    p = rotate(b, p, 1)!;
    expect(p.rotation).toBe(1);
    p = rotate(b, p, 1)!;
    expect(p.rotation).toBe(2);
    p = rotate(b, p, 1)!;
    expect(p.rotation).toBe(3);
    p = rotate(b, p, 1)!;
    expect(p.rotation).toBe(0);
    p = rotate(b, p, -1)!;
    expect(p.rotation).toBe(3);
  });

  it('T-ROT-02 a wall kick keeps the rotation result legal and in bounds', () => {
    const b = createBoard();
    const r = rotate(b, P('T', 0, 0, 4), -1); // hard against the left wall
    expect(r).not.toBeNull();
    expect(isColliding(b, r!)).toBe(false);
    expect(inBounds(r!, b.length)).toBe(true);
  });

  it('T-ROT-03 rotation is rejected when no kick offset fits', () => {
    const b = createBoard();
    const p = P('T', 0, 4, 4);
    const body = new Set(getAbsoluteCells(p).map((c) => `${c.x},${c.y}`));
    for (let y = 0; y < b.length; y++) {
      for (let x = 0; x < 10; x++) {
        if (!body.has(`${x},${y}`)) b[y][x] = 'I';
      }
    }
    expect(rotate(b, p, 1)).toBeNull();
  });

  it('T-ROT-04 the I piece rotates through its own kick table into a legal spot', () => {
    const b = createBoard();
    const r = rotate(b, P('I', 0, 0, 4), 1);
    expect(r).not.toBeNull();
    expect(isColliding(b, r!)).toBe(false);
    expect(inBounds(r!, b.length)).toBe(true);
  });

  it('T-ROT-05 the O piece keeps its footprint when rotated', () => {
    const b = createBoard();
    const p = P('O', 0, 4, 4);
    const r = rotate(b, p, 1)!;
    const key = (q: ActivePiece) => new Set(getAbsoluteCells(q).map((c) => `${c.x},${c.y}`));
    expect(key(r)).toEqual(key(p));
  });
});
