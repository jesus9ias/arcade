// Piece geometry: cells for a given type + rotation, spawn state, and absolute
// board cells. Pure — no DOM, no board dependency.

import { SPAWN_MATRICES, SPAWN_POSITION } from '../constants/pieces';
import type { TetriminoType, RotationState } from '../constants/pieces';

export type { TetriminoType, RotationState } from '../constants/pieces';

export interface Coord {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: TetriminoType;
  rotation: RotationState;
  x: number; // board column of the bounding-box origin
  y: number; // board row of the bounding-box origin (may be in the buffer)
}

// Rotate a square matrix 90° clockwise.
function rotateMatrix(m: number[][]): number[][] {
  const n = m.length;
  const out: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out[i][j] = m[n - 1 - j][i];
    }
  }
  return out;
}

// Filled cells (relative to the bounding-box origin) for a piece in a rotation.
export function getCells(type: TetriminoType, rotation: RotationState): Coord[] {
  let m = SPAWN_MATRICES[type];
  for (let i = 0; i < rotation; i++) m = rotateMatrix(m);
  const cells: Coord[] = [];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x]) cells.push({ x, y });
    }
  }
  return cells;
}

export function createPiece(type: TetriminoType): ActivePiece {
  const { x, y } = SPAWN_POSITION[type];
  return { type, rotation: 0, x, y };
}

// Cells of a placed piece in absolute board coordinates.
export function getAbsoluteCells(piece: ActivePiece): Coord[] {
  return getCells(piece.type, piece.rotation).map((c) => ({ x: c.x + piece.x, y: c.y + piece.y }));
}
