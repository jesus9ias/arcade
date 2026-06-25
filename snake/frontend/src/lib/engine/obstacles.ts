// Pure obstacle placement. Obstacles are generated once at game start and never
// change. Placement avoids every snake's body and the cell directly ahead of it
// so a game is always playable from the first move.

import { GRID_SIZE, OBSTACLE_COUNT } from '../constants';
import type { Position } from '../constants';
import { move, posKey } from './direction';
import type { Snake } from './engine';

/**
 * Generate OBSTACLE_COUNT distinct obstacle positions, none overlapping a snake
 * body or the cell ahead of a snake head. `rng` is injectable for deterministic
 * tests; it defaults to Math.random.
 */
export function generateObstacles(
  state: Pick<{ snakes: Snake[] }, 'snakes'>,
  rng: () => number = Math.random,
): Position[] {
  const forbidden = new Set<string>();
  for (const snake of state.snakes) {
    for (const segment of snake.body) forbidden.add(posKey(segment));
    forbidden.add(posKey(move(snake.body[0], snake.direction)));
  }

  const candidates: Position[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!forbidden.has(posKey({ x, y }))) candidates.push({ x, y });
    }
  }

  // Fisher–Yates partial shuffle, then take the first OBSTACLE_COUNT.
  const count = Math.min(OBSTACLE_COUNT, candidates.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}
