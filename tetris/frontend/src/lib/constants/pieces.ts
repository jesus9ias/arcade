// Tetrimino identities, colours and spawn geometry. Single source of truth for
// piece shapes; every other module derives cells from here.

export type TetriminoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// 0 = spawn, 1 = R (one step clockwise), 2 = 180°, 3 = L (one step counter-clockwise).
export type RotationState = 0 | 1 | 2 | 3;

export const TETRIMINO_TYPES: TetriminoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Neon palette mirrored from the design (design/Tetris.dc.html).
export const PIECE_COLORS: Record<TetriminoType, { main: string; glow: string }> = {
  I: { main: '#37e0e0', glow: 'rgba(55,224,224,0.65)' },
  O: { main: '#e8d84a', glow: 'rgba(232,216,74,0.65)' },
  T: { main: '#b355f2', glow: 'rgba(179,85,242,0.65)' },
  S: { main: '#3fd66b', glow: 'rgba(63,214,107,0.65)' },
  Z: { main: '#f2455a', glow: 'rgba(242,69,90,0.65)' },
  J: { main: '#3d6bf2', glow: 'rgba(61,107,242,0.65)' },
  L: { main: '#f2954a', glow: 'rgba(242,149,74,0.65)' },
};

export const EMPTY_CELL_COLOR = '#12161f';

// Spawn matrices (row-major) in each piece's SRS bounding box. Rotations are
// derived by rotating these 90° clockwise. O is a symmetric 2×2, so it is
// rotation-invariant automatically.
export const SPAWN_MATRICES: Record<TetriminoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// Bounding-box top-left column/row where each piece spawns on a 10-wide board.
// Spawn row = BUFFER_HEIGHT so the piece appears fully at the top of the visible
// field; the hidden buffer rows above are only used for top-out detection.
export const SPAWN_POSITION: Record<TetriminoType, { x: number; y: number }> = {
  I: { x: 3, y: 2 },
  O: { x: 4, y: 2 },
  T: { x: 3, y: 2 },
  S: { x: 3, y: 2 },
  Z: { x: 3, y: 2 },
  J: { x: 3, y: 2 },
  L: { x: 3, y: 2 },
};
