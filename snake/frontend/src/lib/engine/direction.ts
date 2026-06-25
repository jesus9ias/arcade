// Pure direction helpers: relative rotation and one-cell movement.

import { ALL_DIRECTIONS } from '../constants';
import type { Direction, Rotation, Position } from '../constants';

// Clockwise order of headings. Rotating CW steps forward, CCW steps back.
const CW_ORDER: ReadonlyArray<Direction> = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

/** Rotate a heading 90° clockwise or counter-clockwise. */
export function rotate(direction: Direction, rotation: Rotation): Direction {
  const index = CW_ORDER.indexOf(direction);
  const delta = rotation === 'CW' ? 1 : -1;
  return CW_ORDER[(index + delta + CW_ORDER.length) % CW_ORDER.length];
}

/** The position one cell away from `position` in `direction`. */
export function move(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'UP':
      return { x: position.x, y: position.y - 1 };
    case 'DOWN':
      return { x: position.x, y: position.y + 1 };
    case 'LEFT':
      return { x: position.x - 1, y: position.y };
    case 'RIGHT':
      return { x: position.x + 1, y: position.y };
  }
}

/** Opposite heading (a 180° reversal), used to exclude illegal first moves. */
export function opposite(direction: Direction): Direction {
  return rotate(rotate(direction, 'CW'), 'CW');
}

/** Stable string key for a position, for Set/Map membership. */
export function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

/** Whether two positions are the same cell. */
export function samePos(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Every direction, re-exported for neighbour expansion in pathfinding. */
export const DIRECTIONS = ALL_DIRECTIONS;
