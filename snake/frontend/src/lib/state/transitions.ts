// Pure status finite-state machine. Side effects (the loop, localStorage, the
// machine's moves) live in the useSnake controller, not here.

import { GameStatus } from '../constants';
import { createInitialState } from '../engine/engine';
import type { GameState } from '../engine/engine';

export type GameAction = 'START' | 'PAUSE' | 'RESUME' | 'DEATH' | 'NEW_GAME';

export function transition(state: GameState, action: GameAction): GameState {
  switch (action) {
    case 'START':
      return { ...state, status: GameStatus.PLAYING };
    case 'PAUSE':
      return { ...state, status: GameStatus.PAUSED };
    case 'RESUME':
      return { ...state, status: GameStatus.PLAYING };
    case 'DEATH':
      return { ...state, status: GameStatus.GAME_OVER };
    case 'NEW_GAME':
      // A new game resets everything to a fresh IDLE state for the same mode:
      // new obstacles, snake at level 1, score 0.
      return createInitialState(state.mode);
    default:
      return state;
  }
}
