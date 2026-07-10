// Pure finite-state machine and initial-state factory. Status changes and run
// resets only; the controller owns everything time- and input-driven.

import { createBoard } from '../engine/board';
import type { Board } from '../engine/board';
import { createLockState } from '../engine/lock';
import type { LockState } from '../engine/lock';
import { draw } from '../randomizer/bag';
import type { BagState } from '../randomizer/bag';
import { levelGoal } from '../scoring/progression';
import type { ActivePiece, TetriminoType } from '../engine/piece';
import { MAX_HOLDS, NEXT_QUEUE_SIZE } from '../constants/game';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type GameEvent = 'START' | 'PAUSE' | 'RESUME' | 'GAME_OVER' | 'VICTORY' | 'RESTART';

export interface GameState {
  status: GameStatus;
  board: Board;
  active: ActivePiece | null;
  hold: TetriminoType | null;
  holdsRemaining: number;
  holdUsedThisPiece: boolean;
  queue: TetriminoType[];
  bag: BagState;
  startLevel: number;
  level: number;
  creditedLines: number;
  levelGoal: number;
  linesCleared: number;
  score: number;
  breakdown: { regular: number; bonus: number };
  combo: number;
  backToBack: boolean;
  lock: LockState;
  elapsedMs: number;
}

function initialQueue(rng: () => number): { queue: TetriminoType[]; bag: BagState } {
  let bag: BagState = [];
  const queue: TetriminoType[] = [];
  for (let i = 0; i < NEXT_QUEUE_SIZE; i++) {
    const res = draw(bag, rng);
    queue.push(res.piece);
    bag = res.bag;
  }
  return { queue, bag };
}

export function createInitialState(startLevel: number, rng: () => number = Math.random): GameState {
  const { queue, bag } = initialQueue(rng);
  return {
    status: 'IDLE',
    board: createBoard(),
    active: null,
    hold: null,
    holdsRemaining: MAX_HOLDS,
    holdUsedThisPiece: false,
    queue,
    bag,
    startLevel,
    level: startLevel,
    creditedLines: 0,
    levelGoal: levelGoal(startLevel, startLevel),
    linesCleared: 0,
    score: 0,
    breakdown: { regular: 0, bonus: 0 },
    combo: 0,
    backToBack: false,
    lock: createLockState(),
    elapsedMs: 0,
  };
}

export function transition(state: GameState, event: GameEvent): GameState {
  switch (event) {
    case 'START':
      return state.status === 'IDLE' ? { ...state, status: 'PLAYING' } : state;
    case 'PAUSE':
      return state.status === 'PLAYING' ? { ...state, status: 'PAUSED' } : state;
    case 'RESUME':
      return state.status === 'PAUSED' ? { ...state, status: 'PLAYING' } : state;
    case 'GAME_OVER':
      return state.status === 'PLAYING' ? { ...state, status: 'GAME_OVER' } : state;
    case 'VICTORY':
      return state.status === 'PLAYING' ? { ...state, status: 'VICTORY' } : state;
    case 'RESTART':
      return state.status === 'GAME_OVER' || state.status === 'VICTORY'
        ? createInitialState(state.startLevel)
        : state;
    default:
      return state;
  }
}
