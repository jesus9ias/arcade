// Core game constants and domain types. No magic values live outside this folder.

export const GameStatus = {
  SETUP: 'SETUP',
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const GameMode = {
  HVM: 'HVM',
  HVH: 'HVH',
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;

export const DRAW = 'DRAW';
export type Winner = PlayerSymbol | typeof DRAW;

export const BOARD_SIZE = 9;

/** The 8 winning lines as cell indices (rows, columns, diagonals). */
export const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const MEME_CATEGORY = {
  WIN: 'win',
  LOSE: 'lose',
  NEUTRAL: 'neutral',
} as const;
export type MemeCategory = (typeof MEME_CATEGORY)[keyof typeof MEME_CATEGORY];

/** i18n key used as the `winnerName` of a drawn match record. */
export const DRAW_WINNER_NAME_KEY = 'history.draw';

/** Scale used to express a win ratio as a percentage. */
export const PERCENT_SCALE = 100;
