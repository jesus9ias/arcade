import { describe, it, expect } from 'vitest';
import { transition } from '../transitions';
import { createInitialState } from '../../engine/engine';
import type { GameState } from '../../engine/engine';
import { GameStatus, GameMode } from '../../constants';

// Stage 2 failing tests — state/transitions (T-ST-*). Implementation arrives in Stage 3.

const idle = () => createInitialState(GameMode.SIMPLE);

describe('state/transitions', () => {
  it('T-ST-01: IDLE → PLAYING on start', () => {
    expect(transition(idle(), 'START').status).toBe(GameStatus.PLAYING);
  });

  it('T-ST-02: PLAYING → PAUSED on pause', () => {
    const playing = transition(idle(), 'START');
    expect(transition(playing, 'PAUSE').status).toBe(GameStatus.PAUSED);
  });

  it('T-ST-03: PAUSED → PLAYING on resume', () => {
    const paused = transition(transition(idle(), 'START'), 'PAUSE');
    expect(transition(paused, 'RESUME').status).toBe(GameStatus.PLAYING);
  });

  it('T-ST-04: PLAYING → GAME_OVER on death', () => {
    const playing = transition(idle(), 'START');
    expect(transition(playing, 'DEATH').status).toBe(GameStatus.GAME_OVER);
  });

  it('T-ST-05: GAME_OVER → IDLE on new game, level and score reset', () => {
    const over: GameState = {
      ...idle(),
      status: GameStatus.GAME_OVER,
      level: 5,
      scores: { player: 100, machine: 0 },
    };
    const fresh = transition(over, 'NEW_GAME');
    expect(fresh.status).toBe(GameStatus.IDLE);
    expect(fresh.level).toBe(1);
    expect(fresh.scores.player).toBe(0);
  });
});
