// SRS rotation with wall kicks. Tries each kick offset in order and returns the
// first legal placement, or null if the rotation is blocked.

import { isColliding } from '../engine/board';
import type { Board } from '../engine/board';
import type { ActivePiece } from '../engine/piece';
import { I_KICKS, JLSTZ_KICKS, nextRotation } from '../constants/srs';

export interface RotationResult {
  piece: ActivePiece;
  kickIndex: number; // index into the kick table (4 = last kick → upgrades a Mini T-Spin)
}

// Full result including which kick offset succeeded (needed for T-Spin scoring).
export function tryRotate(board: Board, piece: ActivePiece, dir: 1 | -1): RotationResult | null {
  const to = nextRotation(piece.rotation, dir);

  // O never needs kicks and keeps its footprint.
  if (piece.type === 'O') {
    return { piece: { ...piece, rotation: to }, kickIndex: 0 };
  }

  const table = piece.type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const kicks = table[`${piece.rotation}${to}`] ?? [[0, 0]];

  for (let i = 0; i < kicks.length; i++) {
    const [kx, ky] = kicks[i];
    // y is up-positive in the kick table; the board's y grows downward.
    const candidate: ActivePiece = { ...piece, rotation: to, x: piece.x + kx, y: piece.y - ky };
    if (!isColliding(board, candidate)) return { piece: candidate, kickIndex: i };
  }
  return null;
}

export function rotate(board: Board, piece: ActivePiece, dir: 1 | -1): ActivePiece | null {
  return tryRotate(board, piece, dir)?.piece ?? null;
}
