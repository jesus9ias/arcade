// Input timing. DAS = delay before auto-shift kicks in; ARR = repeat interval
// while a direction is held.

export const DAS_MS = 170;
export const ARR_MS = 50;

// Default keyboard bindings (single source of truth for the controls modal).
export const KEY_BINDINGS = {
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  softDrop: ['ArrowDown'],
  hardDrop: [' ', 'Space'],
  rotateCw: ['ArrowUp', 'x', 'X'],
  rotateCcw: ['z', 'Z'],
  hold: ['c', 'C', 'Shift'],
  pause: ['p', 'P', 'Escape'],
  restart: ['Enter'],
} as const;
