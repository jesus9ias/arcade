// Core game enums and domain types. No magic values live outside this folder.

export const GameStatus = {
  LEVEL_SELECT: 'LEVEL_SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  MISSION_FAILED: 'MISSION_FAILED',
  MISSION_ABORTED: 'MISSION_ABORTED',
  ESCAPED: 'ESCAPED',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const PropulsorMode = {
  PROPULSOR: 'PROPULSOR',
  TURBINE: 'TURBINE',
} as const;
export type PropulsorMode = (typeof PropulsorMode)[keyof typeof PropulsorMode];

/** The three thrusters. Left pushes the rover right, right pushes it left, bottom pushes it up. */
export const ThrusterDirection = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTTOM: 'BOTTOM',
} as const;
export type ThrusterDirection = (typeof ThrusterDirection)[keyof typeof ThrusterDirection];

/** A 2D vector in game units. */
export interface Vector2 {
  x: number;
  y: number;
}

export interface RoverState {
  position: Vector2; // top-left corner; origin = top-left of scene
  velocity: Vector2; // game units/s; positive y = downward
  fuel: number; // remaining propulsor fuel
  electricity: number; // remaining turbine electricity (0 on levels without turbines)
  mode: PropulsorMode;
  grounded: boolean; // resting on valid flat terrain
  underwater: boolean; // center of rover below water surface
  destroyed: boolean;
}

export interface SampleState {
  id: string;
  columnIndex: number; // center column of the sample's flat zone
  subsurface: boolean; // requires the laser to be exposed before collection
  exposed?: boolean; // surface samples start exposed; subsurface ones only after the laser fires
  collected: boolean;
}

export interface GameState {
  status: GameStatus;
  levelId: number;
  rover: RoverState;
  samples: SampleState[];
  elapsedMs: number; // ms since mission start; frozen when not PLAYING
  allSamplesCollected: boolean;
  heightmap?: number[]; // mission-owned working terrain; the laser mutates it. Copied from LevelConfig.heightmap at mission start, reset on restart
}
