// Pure terrain queries. The heightmap stores per-column heights measured from the
// bottom of the fixed-height scene; rover positions are measured from the top.
// SCENE_HEIGHT bridges the two frames. Convention: 1 column = COLUMN_WIDTH units.

import { SCENE_HEIGHT, COLUMN_WIDTH, ROVER_WIDTH, ROVER_HEIGHT } from '../constants';
import type { RoverState } from '../constants';
import type { WaterZone } from '../levels';

/** Height at a column, clamped to the heightmap bounds. */
export function getHeight(heightmap: number[], column: number): number {
  if (heightmap.length === 0) return 0;
  const clamped = Math.min(Math.max(column, 0), heightmap.length - 1);
  return heightmap[clamped];
}

/** True when `width` consecutive columns from `startCol` share the same height. */
export function isFlatZone(heightmap: number[], startCol: number, width: number): boolean {
  if (width <= 0) return false;
  if (startCol < 0 || startCol + width > heightmap.length) return false;
  const first = heightmap[startCol];
  for (let c = startCol; c < startCol + width; c++) {
    if (heightmap[c] !== first) return false;
  }
  return true;
}

/**
 * True when a rover-wide footprint centered on `centerCol` lands on flat terrain.
 * A zone narrower than ROVER_WIDTH is never valid.
 */
export function isValidLandingZone(
  heightmap: number[],
  centerCol: number,
  width: number,
): boolean {
  if (width < ROVER_WIDTH) return false;
  const startCol = centerCol - Math.floor(width / 2);
  return isFlatZone(heightmap, startCol, width);
}

/** Columns the rover footprint currently spans, clamped to the heightmap. */
function footprintColumns(rover: RoverState): { left: number; right: number } {
  const left = Math.floor(rover.position.x / COLUMN_WIDTH);
  const right = Math.floor((rover.position.x + ROVER_WIDTH - 1) / COLUMN_WIDTH);
  return { left, right };
}

/** True when the rover's bottom edge has reached or passed the terrain surface. */
export function detectTerrainCollision(rover: RoverState, heightmap: number[]): boolean {
  const { left, right } = footprintColumns(rover);
  let maxHeight = -Infinity;
  for (let c = left; c <= right; c++) {
    maxHeight = Math.max(maxHeight, getHeight(heightmap, c));
  }
  const roverBottomFromBottom = SCENE_HEIGHT - (rover.position.y + ROVER_HEIGHT);
  return roverBottomFromBottom <= maxHeight;
}

/** True when the rover's center is below the surface of any covering water zone. */
export function isUnderwater(rover: RoverState, waterZones: WaterZone[]): boolean {
  const centerColumn = Math.floor((rover.position.x + ROVER_WIDTH / 2) / COLUMN_WIDTH);
  const centerFromBottom = SCENE_HEIGHT - (rover.position.y + ROVER_HEIGHT / 2);
  return waterZones.some(
    (zone) =>
      centerColumn >= zone.startColumn &&
      centerColumn <= zone.endColumn &&
      centerFromBottom < zone.surfaceHeight,
  );
}
