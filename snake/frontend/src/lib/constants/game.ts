// Core game constants and domain types. No magic values live outside this folder.

export const GameStatus = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const GameMode = {
  SIMPLE: 'SIMPLE',
  VERSUS: 'VERSUS',
  // Reserved structural placeholder — not implemented in this version.
  REMOTE: 'REMOTE',
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

/** Modes the player can actually select and play in this version. */
export const SELECTABLE_MODES: ReadonlyArray<GameMode> = [
  GameMode.SIMPLE,
  GameMode.VERSUS,
];

export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
export type Rotation = 'CW' | 'CCW';

/** A cell on the board. Both axes are 0..GRID_SIZE-1. */
export type Position = { x: number; y: number };

export type SnakeId = 'player' | 'machine';
export const SNAKE_ID = {
  PLAYER: 'player',
  MACHINE: 'machine',
} as const;

export const FruitType = {
  CHERRY: 'CHERRY',
  APPLE: 'APPLE',
  ORANGE: 'ORANGE',
  WATERMELON: 'WATERMELON',
} as const;
export type FruitType = (typeof FruitType)[keyof typeof FruitType];

/** Logical board size in cells (square). Independent of the rendered pixel size. */
export const GRID_SIZE = 25;

/** Starting body length for every snake. */
export const INITIAL_SNAKE_LENGTH = 3;

/** Fixed number of obstacles placed once at the start of a game. */
export const OBSTACLE_COUNT = 8;

/** Regular fruits present on the board at once, per mode. */
export const SIMPLE_FRUIT_COUNT = 1;
export const VERSUS_FRUIT_COUNT = 3;

/** Every direction, used by flood-fill / BFS neighbour expansion. */
export const ALL_DIRECTIONS: ReadonlyArray<Direction> = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
