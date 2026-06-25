import { describe, it, expect } from 'vitest';
import { getBestMove } from '../minimax';
import {
  createInitialBoard,
  placeMove,
  checkResult,
  getAvailableCells,
} from '../board';
import type { Board } from '../board';

// Stage 2 failing tests — engine/minimax (T-AI-*). Implementation arrives in Stage 3.

describe('engine/minimax', () => {
  it('T-AI-01: blocks an immediate opponent win', () => {
    // Human (X) threatens to complete row [0,1,2]; the block is cell 2.
    const board: Board = ['X', 'X', null, null, 'O', null, null, null, null];
    expect(getBestMove(board, 'O')).toBe(2);
  });

  it('T-AI-02: takes an immediate winning move when available', () => {
    // Machine (O) completes column [2,5,8] by playing cell 8.
    const board: Board = ['X', 'X', 'O', null, 'X', 'O', null, null, null];
    expect(getBestMove(board, 'O')).toBe(8);
  });

  it('T-AI-03: never loses starting from an empty board (plays O)', () => {
    // The human (X) moves first into every reachable cell; the machine (O)
    // always responds with getBestMove. The human must never force a win.
    const playOut = (board: Board, turn: 'X' | 'O'): void => {
      const result = checkResult(board);
      if (result) {
        expect(result.winner).not.toBe('X');
        return;
      }
      if (turn === 'O') {
        const move = getBestMove(board, 'O');
        playOut(placeMove(board, move, 'O')!, 'X');
        return;
      }
      for (const cell of getAvailableCells(board)) {
        playOut(placeMove(board, cell, 'X')!, 'O');
      }
    };
    playOut(createInitialBoard(), 'X');
  });

  it('T-AI-04: returns a valid, currently-empty cell index', () => {
    const board: Board = ['X', null, null, null, 'O', null, null, null, null];
    const move = getBestMove(board, 'O');
    expect(getAvailableCells(board)).toContain(move);
  });
});
