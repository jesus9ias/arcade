import { BOARD_SIZE, DRAW, WINNING_LINES } from '../constants';
import type { CellValue, PlayerSymbol, Winner } from '../constants';

/** A flat 3x3 board: 9 cells, row-major order. */
export type Board = [
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
];

export interface GameResult {
  winner: Winner;
  /** The winning line indices, or null on a draw. */
  line: number[] | null;
}

export function createInitialBoard(): Board {
  return Array<CellValue>(BOARD_SIZE).fill(null) as Board;
}

/** Returns a new board with `symbol` at `index`, or null if the cell is taken. */
export function placeMove(
  board: Board,
  index: number,
  symbol: PlayerSymbol,
): Board | null {
  if (board[index] !== null) return null;
  const next = [...board] as Board;
  next[index] = symbol;
  return next;
}

/**
 * Returns the result of the board, or null if the game is still in progress.
 * A full board with no winning line is a draw.
 */
export function checkResult(board: Board): GameResult | null {
  for (const [a, b, c] of WINNING_LINES) {
    const value = board[a];
    if (value !== null && value === board[b] && value === board[c]) {
      return { winner: value, line: [a, b, c] };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: DRAW, line: null };
  }
  return null;
}

export function getAvailableCells(board: Board): number[] {
  const cells: number[] = [];
  board.forEach((cell, index) => {
    if (cell === null) cells.push(index);
  });
  return cells;
}
