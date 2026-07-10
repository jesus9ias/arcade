// Presentation constants for the neon design (design/Tetris.dc.html).

export const CELL_PX = 26; // playfield cell size
export const CELL_GAP_PX = 2;
export const MINI_CELL_PX = 22; // hold panel mini-grid
export const NEXT_CELL_PX = 16; // next-queue mini-grid

export const GHOST_OPACITY = 0.22;

// Accent colours per panel border.
export const ACCENT = {
  cyan: '#4de8ff',
  magenta: '#c04dff',
  magentaText: '#c893ff',
  pink: '#ff4d8f',
  yellow: '#f0c94d',
  muted: '#8fa2c4',
} as const;
