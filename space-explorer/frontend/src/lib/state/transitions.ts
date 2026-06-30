// Pure game finite-state machine and mission-state factory. No DOM, no timers.

import { GameStatus, PropulsorMode, ROVER_SPAWN_Y, ROVER_WIDTH } from '../constants';
import type { GameState, SampleState } from '../constants';
import type { LevelConfig } from '../levels';

export type TransitionAction =
  | 'SELECT_LEVEL'
  | 'PAUSE'
  | 'CONTINUE'
  | 'RESTART'
  | 'EXIT'
  | 'DESTROY'
  | 'ESCAPE';

/** Initial samples for a level (none collected). Subsurface samples start hidden
 *  until the laser exposes them; surface samples are exposed from the start. */
function initialSamples(level: LevelConfig): SampleState[] {
  return level.samples.map((sample) => ({
    id: sample.id,
    columnIndex: sample.columnIndex,
    subsurface: sample.subsurface,
    exposed: !sample.subsurface,
    collected: false,
  }));
}

/** Rover spawn x: centered above the first sample's flat zone, else mid-scene. */
function spawnX(level: LevelConfig): number {
  const anchor =
    level.samples[0]?.columnIndex ?? Math.floor(level.heightmap.length / 2);
  return anchor - ROVER_WIDTH / 2;
}

/** Builds a fresh PLAYING mission state for a level. */
export function createMissionState(level: LevelConfig): GameState {
  return {
    status: GameStatus.PLAYING,
    levelId: level.id,
    rover: {
      position: { x: spawnX(level), y: ROVER_SPAWN_Y },
      velocity: { x: 0, y: 0 },
      fuel: level.fuel,
      electricity: level.electricity,
      mode: PropulsorMode.PROPULSOR,
      grounded: false,
      underwater: false,
      destroyed: false,
    },
    samples: initialSamples(level),
    elapsedMs: 0,
    allSamplesCollected: false,
    // Working copy of the terrain; the laser mutates this, never the level data.
    heightmap: [...level.heightmap],
  };
}

/** A neutral state for the level-select screen (no active mission). */
export function createLevelSelectState(): GameState {
  return {
    status: GameStatus.LEVEL_SELECT,
    levelId: 0,
    rover: {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      fuel: 0,
      electricity: 0,
      mode: PropulsorMode.PROPULSOR,
      grounded: false,
      underwater: false,
      destroyed: false,
    },
    samples: [],
    elapsedMs: 0,
    allSamplesCollected: false,
    heightmap: [],
  };
}

/**
 * Pure status machine. SELECT_LEVEL and RESTART rebuild the mission from `level`.
 * ESCAPE branches on whether all samples were collected: complete (ESCAPED) vs.
 * abort (MISSION_ABORTED). CONTINUE resumes from PAUSED but returns ESCAPED to
 * the level select.
 */
export function transition(
  state: GameState,
  action: TransitionAction,
  level?: LevelConfig,
): GameState {
  switch (action) {
    case 'SELECT_LEVEL':
      return level ? createMissionState(level) : state;
    case 'PAUSE':
      return { ...state, status: GameStatus.PAUSED };
    case 'CONTINUE':
      return state.status === GameStatus.ESCAPED
        ? { ...state, status: GameStatus.LEVEL_SELECT }
        : { ...state, status: GameStatus.PLAYING };
    case 'RESTART':
      return level
        ? createMissionState(level)
        : { ...state, status: GameStatus.PLAYING, elapsedMs: 0 };
    case 'EXIT':
      return { ...state, status: GameStatus.LEVEL_SELECT };
    case 'DESTROY':
      return {
        ...state,
        status: GameStatus.MISSION_FAILED,
        rover: { ...state.rover, destroyed: true },
      };
    case 'ESCAPE':
      return {
        ...state,
        status: state.allSamplesCollected
          ? GameStatus.ESCAPED
          : GameStatus.MISSION_ABORTED,
      };
    default:
      return state;
  }
}
