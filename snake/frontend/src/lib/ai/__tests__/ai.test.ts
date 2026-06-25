import { describe, it, expect } from 'vitest';
import { getMachineTurn } from '../ai';
import { rotate, move } from '../../engine/direction';
import type { GameState, Snake } from '../../engine/engine';
import { GameStatus, GameMode, GRID_SIZE } from '../../constants';
import type { Position, Direction } from '../../constants';

// Stage 2 failing tests — ai (T-AI-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });
const key = (p: Position) => `${p.x},${p.y}`;
const manhattan = (a: Position, b: Position) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inBounds = (p: Position) =>
  p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;

const playerAway: Snake = {
  id: 'player',
  body: [P(0, 0), P(1, 0), P(2, 0)],
  direction: 'RIGHT',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
};

const machineSnake = (over: Partial<Snake> = {}): Snake => ({
  id: 'machine',
  body: [P(5, 5), P(5, 6), P(5, 7)],
  direction: 'UP',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
  ...over,
});

const makeVersus = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.PLAYING,
  mode: GameMode.VERSUS,
  level: 1,
  tick: 0,
  snakes: [playerAway, machineSnake()],
  fruits: [{ id: 'f', type: 'APPLE', position: P(5, 1), spawnTick: 0, isBonus: false }],
  obstacles: [],
  scores: { player: 0, machine: 0 },
  fruitsEatenThisLevel: 0,
  fruitsRequiredThisLevel: 12,
  efficiencyStreak: 0,
  boosted: false,
  speedMs: 140,
  survivor: null,
  ...over,
});

// Where the machine's head ends up after applying getMachineTurn's choice.
const machineNextHead = (state: GameState): { head: Position; from: Position } => {
  const machine = state.snakes.find((s) => s.id === 'machine')!;
  const turn = getMachineTurn(state);
  const dir: Direction = turn ? rotate(machine.direction, turn) : machine.direction;
  return { head: move(machine.body[0], dir), from: machine.body[0] };
};

describe('ai — getMachineTurn', () => {
  it('T-AI-01: steers toward the nearest reachable fruit', () => {
    const state = makeVersus(); // head (5,5) UP, fruit (5,1) straight ahead
    const fruit = state.fruits[0].position;
    const { head, from } = machineNextHead(state);
    expect(manhattan(head, fruit)).toBeLessThan(manhattan(from, fruit));
  });

  it('T-AI-02: takes a safe move when the straight path is fatal', () => {
    // At the top edge heading UP — straight is a wall; the fruit is to the left.
    const state = makeVersus({
      snakes: [playerAway, machineSnake({ body: [P(5, 0), P(5, 1), P(5, 2)], direction: 'UP' })],
      fruits: [{ id: 'f', type: 'APPLE', position: P(2, 0), spawnTick: 0, isBonus: false }],
    });
    const { head } = machineNextHead(state);
    expect(inBounds(head)).toBe(true);
  });

  it('T-AI-03: never moves into a wall, obstacle, or body when a safe move exists', () => {
    // Heading UP at the top edge (straight fatal) with an obstacle to the left
    // (CCW fatal); only a clockwise turn is safe.
    const state = makeVersus({
      snakes: [playerAway, machineSnake({ body: [P(5, 0), P(5, 1), P(5, 2)], direction: 'UP' })],
      obstacles: [P(4, 0)],
      fruits: [{ id: 'f', type: 'APPLE', position: P(10, 10), spawnTick: 0, isBonus: false }],
    });
    const { head } = machineNextHead(state);
    const machineBody = new Set(
      state.snakes.find((s) => s.id === 'machine')!.body.map(key),
    );
    expect(inBounds(head)).toBe(true);
    expect(key(head)).not.toBe(key(P(4, 0))); // not the obstacle
    expect(machineBody.has(key(head))).toBe(false); // not its own body
  });
});
