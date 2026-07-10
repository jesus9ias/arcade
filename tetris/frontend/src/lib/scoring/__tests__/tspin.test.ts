import { describe, it, expect } from 'vitest';
import { detectSpin } from '../tspin';
import { createBoard } from '../../engine/board';
import type { Board } from '../../engine/board';
import type { ActivePiece } from '../../engine/piece';

// The T piece sits in a 3×3 box. In spawn rotation (0) the bump points up, so the
// two FRONT corners are the top ones (0,0)&(2,0) and the BACK corners the bottom
// ones (0,2)&(2,2). A T-Spin needs ≥3 filled corners; it is a full spin when both
// front corners are filled (or the last wall-kick was used), otherwise a Mini.
const PX = 3;
const PY = 3;
const T = (): ActivePiece => ({ type: 'T', rotation: 0, x: PX, y: PY });

function boardWithCorners(corners: Array<[number, number]>): Board {
  const b = createBoard();
  for (const [cx, cy] of corners) b[PY + cy][PX + cx] = 'I';
  return b;
}

describe('T-TSP T-Spin detection', () => {
  it('T-TSP-01 three corners incl. both front corners → full', () => {
    const b = boardWithCorners([
      [0, 0],
      [2, 0],
      [0, 2],
    ]);
    expect(detectSpin(b, T(), true, false)).toBe('full');
  });

  it('T-TSP-02 three corners with only one front corner → mini', () => {
    const b = boardWithCorners([
      [0, 2],
      [2, 2],
      [0, 0],
    ]);
    expect(detectSpin(b, T(), true, false)).toBe('mini');
  });

  it('T-TSP-03 last action was not a rotation → none', () => {
    const b = boardWithCorners([
      [0, 0],
      [2, 0],
      [0, 2],
    ]);
    expect(detectSpin(b, T(), false, false)).toBe('none');
  });

  it('T-TSP-04 using the last wall-kick upgrades a mini into a full spin', () => {
    const b = boardWithCorners([
      [0, 2],
      [2, 2],
      [0, 0],
    ]);
    expect(detectSpin(b, T(), true, true)).toBe('full');
  });
});
