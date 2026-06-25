import { createInitialBoard, checkResult, placeMove } from '../engine/board';
import type { Board } from '../engine/board';
import { GameStatus } from '../constants';
import type { GameMode, PlayerSymbol, Winner } from '../constants';

export interface SetupConfig {
  mode: GameMode;
  humanSymbol: PlayerSymbol;
  playerOne: string;
  playerTwo: string;
}

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  board: Board;
  currentTurn: PlayerSymbol;
  humanSymbol: PlayerSymbol;
  playerOne: string;
  playerTwo: string;
  winner: Winner | null;
  winningLine: number[] | null;
  turnCount: number;
}

/** SETUP → IDLE: builds a fresh game from a confirmed setup. */
export function confirmSetup(setup: SetupConfig): GameState {
  return {
    status: GameStatus.IDLE,
    mode: setup.mode,
    board: createInitialBoard(),
    currentTurn: setup.humanSymbol, // the human always moves first
    humanSymbol: setup.humanSymbol,
    playerOne: setup.playerOne,
    playerTwo: setup.playerTwo,
    winner: null,
    winningLine: null,
    turnCount: 0,
  };
}

/**
 * Applies a single move for the current turn. No-op when the game is over or the
 * target cell is occupied. Advances to GAME_OVER on a win or draw, otherwise to
 * PLAYING with the turn handed to the other symbol.
 */
export function applyMove(state: GameState, cell: number): GameState {
  if (state.status === GameStatus.GAME_OVER) return state;

  const board = placeMove(state.board, cell, state.currentTurn);
  if (board === null) return state;

  const turnCount = state.turnCount + 1;
  const result = checkResult(board);

  if (result) {
    return {
      ...state,
      board,
      status: GameStatus.GAME_OVER,
      winner: result.winner,
      winningLine: result.line,
      turnCount,
    };
  }

  return {
    ...state,
    board,
    status: GameStatus.PLAYING,
    currentTurn: state.currentTurn === 'X' ? 'O' : 'X',
    turnCount,
  };
}

/** GAME_OVER → SETUP: clears the board, keeps the configured players/mode. */
export function startNewGame(state: GameState): GameState {
  return {
    ...state,
    status: GameStatus.SETUP,
    board: createInitialBoard(),
    currentTurn: state.humanSymbol,
    winner: null,
    winningLine: null,
    turnCount: 0,
  };
}
