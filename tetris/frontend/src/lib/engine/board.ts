// Board model and pure operations: creation, collision, locking, line clears,
// perfect-clear detection. No DOM, no timers.

import { BOARD_WIDTH, TOTAL_HEIGHT } from '../constants/game';
import { getAbsoluteCells } from './piece';
import type { ActivePiece, TetriminoType } from './piece';

export type CellValue = TetriminoType | null;
export type Board = CellValue[][];

export function createBoard(): Board {
  return Array.from({ length: TOTAL_HEIGHT }, () => Array<CellValue>(BOARD_WIDTH).fill(null));
}

// True if any of the piece's cells is out of bounds or overlaps a filled cell.
export function isColliding(board: Board, piece: ActivePiece): boolean {
  for (const c of getAbsoluteCells(piece)) {
    if (c.x < 0 || c.x >= BOARD_WIDTH || c.y < 0 || c.y >= board.length) return true;
    if (board[c.y][c.x] !== null) return true;
  }
  return false;
}

// Return a new board with the piece's cells written as its type.
export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => row.slice());
  for (const c of getAbsoluteCells(piece)) {
    if (c.y >= 0 && c.y < next.length && c.x >= 0 && c.x < BOARD_WIDTH) {
      next[c.y][c.x] = piece.type;
    }
  }
  return next;
}

// Remove full rows and collapse the stack; returns the new board and the count.
export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => !row.every((c) => c !== null));
  const cleared = board.length - kept.length;
  const empty: Board = Array.from({ length: cleared }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(null),
  );
  return { board: [...empty, ...kept], cleared };
}

export function isPerfectClear(board: Board): boolean {
  return board.every((row) => row.every((c) => c === null));
}

// Rows the piece can fall before landing.
export function dropDistance(board: Board, piece: ActivePiece): number {
  let d = 0;
  while (!isColliding(board, { ...piece, y: piece.y + d + 1 })) d++;
  return d;
}

// The piece projected to its hard-drop landing position (ghost piece).
export function getGhostPiece(board: Board, piece: ActivePiece): ActivePiece {
  return { ...piece, y: piece.y + dropDistance(board, piece) };
}
