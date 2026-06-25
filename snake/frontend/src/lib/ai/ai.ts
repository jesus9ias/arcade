// Pure machine AI for Versus. Efficiency-only: each tick it BFS-searches the
// shortest safe path to the nearest fruit and turns toward it. If no fruit is
// safely reachable, it falls back to the safe move that keeps the most open
// space (flood fill), so it does not seal itself in. It never targets the player.
//
// See snake/spec.md "Machine snake (Versus)" and the Decisions Log for why BFS
// is used over Dijkstra and A*.

import { GRID_SIZE, ALL_DIRECTIONS, SNAKE_ID } from '../constants';
import type { Position, Rotation, Direction } from '../constants';
import { move, rotate, posKey } from '../engine/direction';
import type { GameState } from '../engine/engine';

const inBounds = (p: Position): boolean =>
  p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;

/** Cells a snake head cannot enter: walls (via bounds), obstacles, any body. */
function blockedCells(state: GameState): Set<string> {
  const blocked = new Set<string>();
  for (const o of state.obstacles) blocked.add(posKey(o));
  for (const snake of state.snakes) {
    for (const segment of snake.body) blocked.add(posKey(segment));
  }
  return blocked;
}

const isFree = (p: Position, blocked: Set<string>): boolean =>
  inBounds(p) && !blocked.has(posKey(p));

// The machine's three legal first moves (no 180° reversal): straight, CW, CCW.
function firstMoves(direction: Direction): { rot: Rotation | null; dir: Direction }[] {
  return [
    { rot: null, dir: direction },
    { rot: 'CW', dir: rotate(direction, 'CW') },
    { rot: 'CCW', dir: rotate(direction, 'CCW') },
  ];
}

/** Count of free cells reachable from `start` (capped), for the survival heuristic. */
function openSpace(start: Position, blocked: Set<string>, cap: number): number {
  const seen = new Set<string>([posKey(start)]);
  const queue: Position[] = [start];
  let count = 0;
  while (queue.length && count < cap) {
    const p = queue.shift()!;
    count += 1;
    for (const dir of ALL_DIRECTIONS) {
      const np = move(p, dir);
      const k = posKey(np);
      if (seen.has(k) || !isFree(np, blocked)) continue;
      seen.add(k);
      queue.push(np);
    }
  }
  return count;
}

/** BFS from the head to the nearest fruit; return the first-step rotation. */
function bfsToFruit(state: GameState, head: Position, direction: Direction, blocked: Set<string>): Rotation | null | undefined {
  const fruitCells = new Set(state.fruits.map((f) => posKey(f.position)));
  const visited = new Set<string>([posKey(head)]);
  const queue: { pos: Position; firstRot: Rotation | null }[] = [];

  // Seed with the legal first moves; an adjacent fruit resolves immediately.
  for (const { rot, dir } of firstMoves(direction)) {
    const np = move(head, dir);
    if (!isFree(np, blocked)) continue;
    if (fruitCells.has(posKey(np))) return rot;
    visited.add(posKey(np));
    queue.push({ pos: np, firstRot: rot });
  }

  while (queue.length) {
    const { pos, firstRot } = queue.shift()!;
    for (const dir of ALL_DIRECTIONS) {
      const np = move(pos, dir);
      const k = posKey(np);
      if (visited.has(k) || !isFree(np, blocked)) continue;
      if (fruitCells.has(k)) return firstRot;
      visited.add(k);
      queue.push({ pos: np, firstRot });
    }
  }
  return undefined; // no fruit reachable
}

/** Survival fallback: the safe first move that maximises reachable open space. */
function survivalTurn(head: Position, direction: Direction, blocked: Set<string>): Rotation | null {
  let best: { rot: Rotation | null; space: number } | null = null;
  for (const { rot, dir } of firstMoves(direction)) {
    const np = move(head, dir);
    if (!isFree(np, blocked)) continue;
    const space = openSpace(np, blocked, GRID_SIZE * GRID_SIZE);
    if (!best || space > best.space) best = { rot, space };
  }
  return best ? best.rot : null;
}

/**
 * The rotation the machine snake should apply this tick: `CW`, `CCW`, or `null`
 * to continue straight.
 */
export function getMachineTurn(state: GameState): Rotation | null {
  const machine = state.snakes.find((s) => s.id === SNAKE_ID.MACHINE);
  if (!machine || !machine.alive) return null;

  const blocked = blockedCells(state);
  const head = machine.body[0];

  const toFruit = bfsToFruit(state, head, machine.direction, blocked);
  if (toFruit !== undefined) return toFruit;

  return survivalTurn(head, machine.direction, blocked);
}
