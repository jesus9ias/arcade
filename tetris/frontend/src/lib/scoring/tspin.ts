// T-Spin detection via the 3-corner rule. Only the T piece can spin, and only
// when the last successful action before lock was a rotation.

import { BOARD_WIDTH } from '../constants/game';
import type { Board } from '../engine/board';
import type { ActivePiece, RotationState } from '../engine/piece';

export type SpinResult = 'none' | 'mini' | 'full';

// Corners of the T's 3×3 bounding box (relative to its origin).
const CORNERS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [2, 0],
  [0, 2],
  [2, 2],
];

// The two FRONT corners (the side the bump points to) per rotation.
const FRONT_CORNERS: Record<RotationState, ReadonlyArray<readonly [number, number]>> = {
  0: [[0, 0], [2, 0]], // bump up → top corners
  1: [[2, 0], [2, 2]], // bump right → right corners
  2: [[0, 2], [2, 2]], // bump down → bottom corners
  3: [[0, 0], [0, 2]], // bump left → left corners
};

// A corner counts as filled when it is out of bounds (wall/floor) or occupied.
function isFilled(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= board.length) return true;
  return board[y][x] !== null;
}

export function detectSpin(
  board: Board,
  piece: ActivePiece,
  lastActionWasRotation: boolean,
  usedLastKick: boolean,
): SpinResult {
  if (piece.type !== 'T' || !lastActionWasRotation) return 'none';

  const filled = CORNERS.filter(([cx, cy]) => isFilled(board, piece.x + cx, piece.y + cy)).length;
  if (filled < 3) return 'none';

  const bothFront = FRONT_CORNERS[piece.rotation].every(([cx, cy]) =>
    isFilled(board, piece.x + cx, piece.y + cy),
  );

  return bothFront || usedLastKick ? 'full' : 'mini';
}
