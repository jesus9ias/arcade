// Presentation constants for the canvas renderer and modals.

import { FruitType } from './game';
import { Theme } from './preferences';
import type { FruitType as FruitTypeValue } from './game';
import type { Theme as ThemeValue } from './preferences';

/** Rows per page in the history modal (matches the Gato pattern). */
export const HISTORY_PAGE_SIZE = 10;

/** Logical pixel size of one board cell on the canvas before CSS scaling. */
export const CELL_PIXELS = 24;

/** Fraction of a cell used as a gap when drawing snake segments / fruit. */
export const CELL_PADDING = 0.12;

export interface BoardPalette {
  bg: string;
  grid: string;
  obstacle: string;
  player: string;
  playerHead: string;
  machine: string;
  machineHead: string;
}

/** Forest palette for the canvas, per theme. */
export const BOARD_PALETTE: Record<ThemeValue, BoardPalette> = {
  [Theme.LIGHT]: {
    bg: '#e6f0d8',
    grid: '#d4e4c0',
    obstacle: '#6d4c34',
    player: '#3a8c3a',
    playerHead: '#226022',
    machine: '#9c7b5b',
    machineHead: '#6b4f37',
  },
  [Theme.DARK]: {
    bg: '#16241a',
    grid: '#1f3324',
    obstacle: '#3f2e20',
    player: '#5cb85c',
    playerHead: '#a5d6a7',
    machine: '#b8a188',
    machineHead: '#d7c4ad',
  },
};

/** Fruit fill colour per type. */
export const FRUIT_COLOR: Record<FruitTypeValue, string> = {
  [FruitType.CHERRY]: '#d6324a',
  [FruitType.APPLE]: '#46a84a',
  [FruitType.ORANGE]: '#f08a24',
  [FruitType.WATERMELON]: '#2f8f4e',
};

export const GOLDEN_FRUIT_COLOR = '#ffd24a';
