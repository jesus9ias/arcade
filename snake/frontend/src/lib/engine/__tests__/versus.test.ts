import { describe, it, expect } from 'vitest';
import { advanceTick } from '../engine';
import type { GameState, Snake, Fruit } from '../engine';
import { GameStatus, GameMode, SURVIVOR_BONUS } from '../../constants';
import type { Position, SnakeId } from '../../constants';

// Stage 2 failing tests — engine/versus (T-VS-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });

const makeSnake = (over: Partial<Snake> = {}): Snake => ({
  id: 'player',
  body: [P(5, 5), P(4, 5), P(3, 5)],
  direction: 'RIGHT',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
  ...over,
});

const farFruit: Fruit = {
  id: 'f',
  type: 'CHERRY',
  position: P(20, 20),
  spawnTick: 0,
  isBonus: false,
};

const findSnake = (state: GameState, id: SnakeId) =>
  state.snakes.find((s) => s.id === id)!;

const makeVersus = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.PLAYING,
  mode: GameMode.VERSUS,
  level: 1,
  tick: 0,
  snakes: [
    makeSnake({ id: 'player' }),
    makeSnake({ id: 'machine', body: [P(5, 15), P(4, 15), P(3, 15)] }),
  ],
  fruits: [farFruit],
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

describe('engine/versus', () => {
  it('T-VS-01: either snake dying ends the game', () => {
    const state = makeVersus({
      snakes: [
        makeSnake({ id: 'player', body: [P(24, 5), P(23, 5), P(22, 5)] }), // into the wall
        makeSnake({ id: 'machine', body: [P(5, 15), P(4, 15), P(3, 15)] }),
      ],
    });
    expect(advanceTick(state).status).toBe(GameStatus.GAME_OVER);
  });

  it('T-VS-02: the surviving snake gets a +50% bonus', () => {
    const state = makeVersus({
      snakes: [
        makeSnake({ id: 'player', body: [P(24, 5), P(23, 5), P(22, 5)] }), // player dies
        makeSnake({ id: 'machine', body: [P(5, 15), P(4, 15), P(3, 15)] }),
      ],
      scores: { player: 30, machine: 40 },
    });
    const next = advanceTick(state);
    expect(findSnake(next, 'player').alive).toBe(false);
    expect(next.scores.machine).toBe(Math.round(40 * SURVIVOR_BONUS));
    expect(next.survivor).toBe('machine');
  });

  it('T-VS-03: both snakes dying on the same tick gives no survivor bonus', () => {
    const state = makeVersus({
      snakes: [
        makeSnake({ id: 'player', body: [P(24, 5), P(23, 5), P(22, 5)] }),
        makeSnake({ id: 'machine', body: [P(24, 15), P(23, 15), P(22, 15)] }),
      ],
      scores: { player: 10, machine: 20 },
    });
    const next = advanceTick(state);
    expect(next.status).toBe(GameStatus.GAME_OVER);
    expect(next.survivor).toBeNull();
    expect(next.scores.player).toBe(10);
    expect(next.scores.machine).toBe(20);
  });

  it('T-VS-04: a snake moving into the other snake dies', () => {
    // The machine head moves into a stable middle segment of the player's body.
    const player = makeSnake({
      id: 'player',
      body: [P(10, 10), P(10, 11), P(10, 12), P(10, 13)],
      direction: 'UP',
    });
    const machine = makeSnake({
      id: 'machine',
      body: [P(9, 11), P(8, 11), P(7, 11)],
      direction: 'RIGHT', // next head (10,11) is inside the player's body
    });
    const next = advanceTick(makeVersus({ snakes: [player, machine] }));
    expect(findSnake(next, 'machine').alive).toBe(false);
  });
});
