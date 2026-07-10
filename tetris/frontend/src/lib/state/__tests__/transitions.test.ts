import { describe, it, expect } from 'vitest';
import { createInitialState, transition } from '../transitions';

describe('T-ST state transitions', () => {
  it('T-ST-01 IDLE → PLAYING on START', () => {
    const s = createInitialState(1);
    expect(s.status).toBe('IDLE');
    expect(transition(s, 'START').status).toBe('PLAYING');
  });

  it('T-ST-02 PLAYING ↔ PAUSED', () => {
    let s = transition(createInitialState(1), 'START');
    s = transition(s, 'PAUSE');
    expect(s.status).toBe('PAUSED');
    s = transition(s, 'RESUME');
    expect(s.status).toBe('PLAYING');
  });

  it('T-ST-03 PLAYING → GAME_OVER', () => {
    const s = transition(createInitialState(1), 'START');
    expect(transition(s, 'GAME_OVER').status).toBe('GAME_OVER');
  });

  it('T-ST-04 PLAYING → VICTORY', () => {
    const s = transition(createInitialState(1), 'START');
    expect(transition(s, 'VICTORY').status).toBe('VICTORY');
  });

  it('T-ST-05 RESTART returns to IDLE with a cleared board and preserved start level', () => {
    let s = transition(createInitialState(3), 'START');
    s = transition(s, 'GAME_OVER');
    const r = transition(s, 'RESTART');
    expect(r.status).toBe('IDLE');
    expect(r.score).toBe(0);
    expect(r.startLevel).toBe(3);
    expect(r.board.flat().every((c) => c === null)).toBe(true);
  });
});
