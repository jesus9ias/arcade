import { describe, it, expect } from 'vitest';
import { createInitialState, advanceTick, queueTurn, spawnFruit } from '../engine';
import type { GameState, Snake, Fruit } from '../engine';
import { GameStatus, GameMode } from '../../constants';
import type { Position } from '../../constants';

// Stage 2 failing tests — engine (T-ENG-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });
const key = (p: Position) => `${p.x},${p.y}`;

const makeSnake = (over: Partial<Snake> = {}): Snake => ({
  id: 'player',
  body: [P(3, 5), P(2, 5), P(1, 5)],
  direction: 'RIGHT',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
  ...over,
});

const makeFruit = (over: Partial<Fruit> = {}): Fruit => ({
  id: 'f1',
  type: 'CHERRY',
  position: P(20, 20),
  spawnTick: 0,
  isBonus: false,
  ...over,
});

const makeState = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.PLAYING,
  mode: GameMode.SIMPLE,
  level: 1,
  tick: 0,
  snakes: [makeSnake()],
  fruits: [makeFruit()],
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

describe('engine — createInitialState', () => {
  it('T-ENG-01: the initial state is IDLE at level 1 with score 0', () => {
    const state = createInitialState(GameMode.SIMPLE);
    expect(state.status).toBe(GameStatus.IDLE);
    expect(state.level).toBe(1);
    expect(state.scores.player).toBe(0);
  });
});

describe('engine — advanceTick', () => {
  it('T-ENG-02: advances the head one cell and trims the tail when not growing', () => {
    const next = advanceTick(makeState());
    const snake = next.snakes[0];
    expect(snake.body[0]).toEqual(P(4, 5));
    expect(snake.body).toHaveLength(3);
    expect(snake.body).not.toContainEqual(P(1, 5)); // old tail removed
  });

  it('T-ENG-03: eating a fruit grows the snake and a replacement appears', () => {
    const next = advanceTick(makeState({ fruits: [makeFruit({ position: P(4, 5) })] }));
    expect(next.snakes[0].body).toHaveLength(4);
    expect(next.scores.player).toBeGreaterThan(0);
    expect(next.fruits).toHaveLength(1); // replacement spawned
  });

  it('T-ENG-04: moving into a wall kills the snake and ends the game', () => {
    const next = advanceTick(
      makeState({ snakes: [makeSnake({ body: [P(24, 5), P(23, 5), P(22, 5)] })] }),
    );
    expect(next.snakes[0].alive).toBe(false);
    expect(next.status).toBe(GameStatus.GAME_OVER);
  });

  it('T-ENG-05: moving into an obstacle kills the snake', () => {
    const next = advanceTick(makeState({ obstacles: [P(4, 5)] }));
    expect(next.snakes[0].alive).toBe(false);
  });

  it('T-ENG-06: moving into its own body kills the snake', () => {
    // Heading DOWN sends the head into a middle body segment (not the tail).
    const body = [P(5, 5), P(4, 5), P(4, 6), P(5, 6), P(6, 6), P(6, 5)];
    const next = advanceTick(makeState({ snakes: [makeSnake({ body, direction: 'DOWN' })] }));
    expect(next.snakes[0].alive).toBe(false);
  });

  it('T-ENG-07: only the first buffered turn is applied per tick', () => {
    let state = makeState({ snakes: [makeSnake({ direction: 'UP' })] });
    state = queueTurn(state, 'player', 'CW');
    state = queueTurn(state, 'player', 'CW'); // ignored — the first turn wins
    const next = advanceTick(state);
    expect(next.snakes[0].direction).toBe('RIGHT'); // one CW from UP, never DOWN
  });

  it('T-ENG-08: a spawned fruit never lands on a snake, obstacle, or existing fruit', () => {
    const state = makeState({
      obstacles: [P(10, 10), P(11, 10)],
      fruits: [makeFruit({ position: P(20, 20) })],
    });
    const occupied = new Set([
      ...state.snakes[0].body.map(key),
      ...state.obstacles.map(key),
      ...state.fruits.map((f) => key(f.position)),
    ]);
    for (let i = 0; i < 100; i++) {
      const fruit = spawnFruit(state);
      expect(occupied.has(key(fruit.position))).toBe(false);
    }
  });
});
