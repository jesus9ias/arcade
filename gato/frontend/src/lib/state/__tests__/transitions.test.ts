import { describe, it, expect } from 'vitest';
import { confirmSetup, applyMove, startNewGame } from '../transitions';
import { GameStatus, GameMode } from '../../constants';

// Stage 2 failing tests — state/transitions (T-ST-*). Implementation arrives in Stage 3.

const newIdleState = () =>
  confirmSetup({
    mode: GameMode.HVM,
    humanSymbol: 'X',
    playerOne: 'Jesús',
    playerTwo: 'Machine',
  });

// Drives an HVM game (human X first) to a row [0,1,2] win for X.
const buildWinState = () => {
  let state = newIdleState();
  for (const cell of [0, 3, 1, 4, 2]) {
    state = applyMove(state, cell);
  }
  return state;
};

describe('state/transitions', () => {
  it('T-ST-01: SETUP → IDLE on confirm', () => {
    const idle = newIdleState();
    expect(idle.status).toBe(GameStatus.IDLE);
    expect(idle.board.every((cell) => cell === null)).toBe(true);
    expect(idle.turnCount).toBe(0);
  });

  it('T-ST-02: IDLE → PLAYING on the first move', () => {
    const playing = applyMove(newIdleState(), 0);
    expect(playing.status).toBe(GameStatus.PLAYING);
    expect(playing.board[0]).toBe('X');
    expect(playing.turnCount).toBe(1);
  });

  it('T-ST-03: PLAYING → GAME_OVER on a win', () => {
    const state = buildWinState();
    expect(state.status).toBe(GameStatus.GAME_OVER);
    expect(state.winner).toBe('X');
    expect(state.winningLine).toEqual([0, 1, 2]);
  });

  it('T-ST-04: PLAYING → GAME_OVER on a draw', () => {
    let state = newIdleState();
    for (const cell of [0, 1, 2, 4, 3, 5, 7, 6, 8]) {
      state = applyMove(state, cell);
    }
    expect(state.status).toBe(GameStatus.GAME_OVER);
    expect(state.winner).toBe('DRAW');
  });

  it('T-ST-05: GAME_OVER → SETUP on a new game', () => {
    const fresh = startNewGame(buildWinState());
    expect(fresh.status).toBe(GameStatus.SETUP);
    expect(fresh.board.every((cell) => cell === null)).toBe(true);
  });

  it('T-ST-06: a move is rejected in GAME_OVER state', () => {
    const over = buildWinState();
    // cell 5 is empty in the win board, but the game is over
    expect(applyMove(over, 5)).toEqual(over);
  });
});
