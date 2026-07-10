import { describe, it, expect } from 'vitest';
import { createBoard, isColliding, lockPiece, clearLines, isPerfectClear } from '../board';
import { getAbsoluteCells, getCells } from '../piece';
import type { TetriminoType, RotationState, ActivePiece } from '../piece';

const WIDTH = 10;
const piece = (over: Partial<ActivePiece> = {}): ActivePiece => ({
  type: 'O',
  rotation: 0,
  x: 3,
  y: 3,
  ...over,
});

describe('T-BRD board', () => {
  it('T-BRD-01 empty board is 10 wide, >=20 tall (incl. buffer), all null', () => {
    const b = createBoard();
    expect(b[0].length).toBe(WIDTH);
    expect(b.length).toBeGreaterThanOrEqual(20);
    expect(b.every((row) => row.every((c) => c === null))).toBe(true);
  });

  it('T-BRD-02 lockPiece writes the piece cells and does not mutate the input', () => {
    const b = createBoard();
    const p = piece();
    const locked = lockPiece(b, p);
    for (const c of getAbsoluteCells(p)) {
      expect(locked[c.y][c.x]).toBe('O');
    }
    // purity: the original board is untouched
    expect(b.every((row) => row.every((c) => c === null))).toBe(true);
  });

  it('T-BRD-03 isColliding detects walls, floor and existing blocks', () => {
    const b = createBoard();
    const inBounds = piece();
    expect(isColliding(b, inBounds)).toBe(false);
    expect(isColliding(b, piece({ x: -1 }))).toBe(true); // left wall
    expect(isColliding(b, piece({ x: WIDTH }))).toBe(true); // right wall
    expect(isColliding(b, piece({ y: b.length }))).toBe(true); // floor
    const locked = lockPiece(b, inBounds);
    expect(isColliding(locked, inBounds)).toBe(true); // overlaps blocks
  });

  it('T-BRD-04 clearLines removes full rows and collapses the stack', () => {
    const b = createBoard();
    const last = b.length - 1;
    for (let x = 0; x < WIDTH; x++) b[last][x] = 'I';
    b[last - 1][0] = 'T';
    const { board, cleared } = clearLines(b);
    expect(cleared).toBe(1);
    expect(board[last][0]).toBe('T'); // the lone block fell one row
    for (let x = 1; x < WIDTH; x++) expect(board[last][x]).toBeNull();
  });

  it('T-BRD-05 isPerfectClear is true only when the board is empty', () => {
    const b = createBoard();
    expect(isPerfectClear(b)).toBe(true);
    b[b.length - 1][0] = 'S';
    expect(isPerfectClear(b)).toBe(false);
  });

  it('T-BRD-06 getCells: 4 cells per piece/rotation, O invariant, I row/col', () => {
    const types: TetriminoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const rotations: RotationState[] = [0, 1, 2, 3];
    for (const t of types) {
      for (const r of rotations) {
        expect(getCells(t, r).length).toBe(4);
      }
    }
    const key = (cs: { x: number; y: number }[]) => new Set(cs.map((c) => `${c.x},${c.y}`));
    const o0 = key(getCells('O', 0));
    for (const r of [1, 2, 3] as RotationState[]) {
      expect(key(getCells('O', r))).toEqual(o0);
    }
    expect(new Set(getCells('I', 0).map((c) => c.y)).size).toBe(1); // horizontal → one row
    expect(new Set(getCells('I', 1).map((c) => c.x)).size).toBe(1); // vertical → one column
  });
});
