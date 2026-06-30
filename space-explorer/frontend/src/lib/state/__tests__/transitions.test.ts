import { describe, it, expect } from 'vitest';
import { transition } from '../transitions';
import { GameStatus, PropulsorMode } from '../../constants';
import type { GameState } from '../../constants';
import type { LevelConfig } from '../../levels';

// Stage 2 failing tests — state/transitions (T-ST-*). Implementation arrives in Stage 3.

const makeLevel = (id = 1): LevelConfig => ({
  id,
  name: `Level ${id}`,
  distanceFromEarth: '1 light year',
  gravity: 1,
  fuel: 1000,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: [],
  waterZones: [],
  samples: [],
  theme: {
    skyColorTop: '#000010',
    skyColorBottom: '#101030',
    groundColor: '#203020',
    waterColor: '#102030',
  },
});

const makeState = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.PLAYING,
  levelId: 1,
  rover: {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    fuel: 1000,
    electricity: 0,
    mode: PropulsorMode.PROPULSOR,
    grounded: false,
    underwater: false,
    destroyed: false,
  },
  samples: [],
  elapsedMs: 5000,
  allSamplesCollected: false,
  ...over,
});

describe('state/transitions', () => {
  it('T-ST-01: LEVEL_SELECT → PLAYING on level selected', () => {
    const state = makeState({ status: GameStatus.LEVEL_SELECT });
    expect(transition(state, 'SELECT_LEVEL', makeLevel(1)).status).toBe(GameStatus.PLAYING);
  });

  it('T-ST-02: PLAYING → PAUSED', () => {
    expect(transition(makeState({ status: GameStatus.PLAYING }), 'PAUSE').status).toBe(
      GameStatus.PAUSED,
    );
  });

  it('T-ST-03: PAUSED → PLAYING on continue', () => {
    expect(transition(makeState({ status: GameStatus.PAUSED }), 'CONTINUE').status).toBe(
      GameStatus.PLAYING,
    );
  });

  it('T-ST-04: PAUSED → PLAYING on restart (mission reset)', () => {
    const next = transition(
      makeState({ status: GameStatus.PAUSED, elapsedMs: 9000 }),
      'RESTART',
      makeLevel(1),
    );
    expect(next.status).toBe(GameStatus.PLAYING);
    expect(next.elapsedMs).toBe(0);
  });

  it('T-ST-05: PAUSED → LEVEL_SELECT on exit', () => {
    expect(transition(makeState({ status: GameStatus.PAUSED }), 'EXIT').status).toBe(
      GameStatus.LEVEL_SELECT,
    );
  });

  it('T-ST-06: PLAYING → MISSION_FAILED on destroy', () => {
    expect(transition(makeState({ status: GameStatus.PLAYING }), 'DESTROY').status).toBe(
      GameStatus.MISSION_FAILED,
    );
  });

  it('T-ST-07: PLAYING → ESCAPED when all samples collected', () => {
    const state = makeState({ status: GameStatus.PLAYING, allSamplesCollected: true });
    expect(transition(state, 'ESCAPE').status).toBe(GameStatus.ESCAPED);
  });

  it('T-ST-08: PLAYING → MISSION_ABORTED when aborting with samples missing', () => {
    const state = makeState({ status: GameStatus.PLAYING, allSamplesCollected: false });
    expect(transition(state, 'ESCAPE').status).toBe(GameStatus.MISSION_ABORTED);
  });

  it('T-ST-09: MISSION_FAILED → PLAYING on restart (mission reset)', () => {
    const next = transition(
      makeState({ status: GameStatus.MISSION_FAILED, elapsedMs: 9000 }),
      'RESTART',
      makeLevel(1),
    );
    expect(next.status).toBe(GameStatus.PLAYING);
    expect(next.elapsedMs).toBe(0);
  });

  it('T-ST-10: MISSION_FAILED → LEVEL_SELECT on exit', () => {
    expect(transition(makeState({ status: GameStatus.MISSION_FAILED }), 'EXIT').status).toBe(
      GameStatus.LEVEL_SELECT,
    );
  });

  it('T-ST-11: ESCAPED → LEVEL_SELECT on continue', () => {
    expect(transition(makeState({ status: GameStatus.ESCAPED }), 'CONTINUE').status).toBe(
      GameStatus.LEVEL_SELECT,
    );
  });

  it('T-ST-12: MISSION_ABORTED → PLAYING on restart (mission reset)', () => {
    const next = transition(
      makeState({ status: GameStatus.MISSION_ABORTED, elapsedMs: 9000 }),
      'RESTART',
      makeLevel(1),
    );
    expect(next.status).toBe(GameStatus.PLAYING);
    expect(next.elapsedMs).toBe(0);
  });

  it('T-ST-13: MISSION_ABORTED → LEVEL_SELECT on exit', () => {
    expect(transition(makeState({ status: GameStatus.MISSION_ABORTED }), 'EXIT').status).toBe(
      GameStatus.LEVEL_SELECT,
    );
  });
});
