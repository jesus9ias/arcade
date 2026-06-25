import { describe, it, expect } from 'vitest';
import { generateObstacles } from '../obstacles';
import { move } from '../direction';
import type { Snake } from '../engine';
import { OBSTACLE_COUNT } from '../../constants';
import type { Position } from '../../constants';

// Stage 2 failing tests — engine/obstacles (T-OBST-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });
const key = (p: Position) => `${p.x},${p.y}`;

const snake: Snake = {
  id: 'player',
  body: [P(12, 12), P(11, 12), P(10, 12)],
  direction: 'RIGHT',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
};

describe('engine/obstacles — generateObstacles', () => {
  it('T-OBST-01: generates exactly OBSTACLE_COUNT distinct obstacles', () => {
    const obstacles = generateObstacles({ snakes: [snake] });
    expect(obstacles).toHaveLength(OBSTACLE_COUNT);
    expect(new Set(obstacles.map(key)).size).toBe(OBSTACLE_COUNT);
  });

  it('T-OBST-02: no obstacle overlaps the snake body or the cell directly ahead', () => {
    const obstacles = generateObstacles({ snakes: [snake] });
    const ahead = move(snake.body[0], snake.direction);
    const forbidden = new Set([...snake.body.map(key), key(ahead)]);
    for (const o of obstacles) {
      expect(forbidden.has(key(o))).toBe(false);
    }
  });
});
