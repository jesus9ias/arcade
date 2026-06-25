import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  placeMove,
  checkResult,
  getAvailableCells,
} from '../board';
import type { Board } from '../board';

// Stage 2 failing tests — engine/board (T-ENG-*). Implementation arrives in Stage 3.

describe('engine/board', () => {
  it('T-ENG-01: initial board has 9 null cells', () => {
    const board = createInitialBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });

  it('T-ENG-02: placing a move on an empty cell returns a new board with the symbol', () => {
    const board = createInitialBoard();
    const next = placeMove(board, 4, 'X');
    expect(next).not.toBeNull();
    expect(next![4]).toBe('X');
    // the original board is not mutated
    expect(board[4]).toBeNull();
  });

  it('T-ENG-03: placing a move on an occupied cell returns null', () => {
    const occupied = placeMove(createInitialBoard(), 4, 'O');
    expect(placeMove(occupied!, 4, 'X')).toBeNull();
  });

  it('T-ENG-04: detects a row win', () => {
    const board: Board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(checkResult(board)).toEqual({ winner: 'X', line: [0, 1, 2] });
  });

  it('T-ENG-05: detects a column win', () => {
    const board: Board = ['X', null, null, 'X', null, null, 'X', null, null];
    expect(checkResult(board)).toEqual({ winner: 'X', line: [0, 3, 6] });
  });

  it('T-ENG-06: detects a diagonal win', () => {
    const board: Board = [null, null, 'X', null, 'X', null, 'X', null, null];
    expect(checkResult(board)).toEqual({ winner: 'X', line: [2, 4, 6] });
  });

  it('T-ENG-07: detects a draw on a full board with no winner', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(checkResult(board)).toEqual({ winner: 'DRAW', line: null });
  });

  it('T-ENG-08: returns null on an incomplete board with no winner', () => {
    const board: Board = ['X', 'O', null, null, 'X', null, null, null, 'O'];
    expect(checkResult(board)).toBeNull();
  });

  it('T-ENG-09: getAvailableCells returns indices of empty cells', () => {
    const board: Board = ['X', 'O', 'X', null, null, null, null, null, null];
    expect(getAvailableCells(board)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('T-ENG-10: getAvailableCells returns an empty array on a full board', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(getAvailableCells(board)).toEqual([]);
  });
});
