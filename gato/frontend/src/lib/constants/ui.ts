import type { PlayerSymbol } from './game';

/** Delay before the machine plays, so its move is perceivable. */
export const MACHINE_MOVE_DELAY_MS = 450;

/** Selectable symbols, in display order. */
export const SYMBOLS: readonly PlayerSymbol[] = ['X', 'O'];
