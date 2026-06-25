// Pure game engine. Produces a new state from the current one — no DOM, no
// clock, no randomness beyond an injectable RNG for fruit placement. The
// real-time loop and timers live in the React controller, not here.

import {
  GameStatus,
  GameMode,
  GRID_SIZE,
  INITIAL_SNAKE_LENGTH,
  SIMPLE_FRUIT_COUNT,
  VERSUS_FRUIT_COUNT,
  FruitType,
  FRUIT_BASE_VALUE,
  FRUIT_SPAWN_WEIGHT,
  GOLDEN_BASE_VALUE,
  SIMPLE_MULTIPLIER,
  VERSUS_MULTIPLIER,
  SURVIVOR_BONUS,
  BOOST_FACTOR,
  SNAKE_ID,
} from '../constants';
import type {
  GameMode as GameModeValue,
  Direction,
  Rotation,
  Position,
  SnakeId,
  FruitType as FruitTypeValue,
} from '../constants';
import { move, rotate, posKey, samePos } from './direction';
import { fruitPoints, decayFactor } from '../scoring/scoring';
import { updateStreak } from '../scoring/efficiency';
import { fruitsRequired, speedForLevel } from '../level/level';
import { generateObstacles } from './obstacles';

export interface Snake {
  id: SnakeId;
  body: Position[]; // head at index 0
  direction: Direction;
  pendingTurn: Rotation | null; // at most one buffered turn per tick interval
  pendingGrowth: number; // segments still to add (tail not trimmed while > 0)
  alive: boolean;
}

export interface Fruit {
  id: string;
  type: FruitTypeValue;
  position: Position;
  spawnTick: number;
  isBonus: boolean; // golden fruit: no decay, excluded from the streak
}

export interface GameState {
  status: GameStatus;
  mode: GameModeValue;
  level: number;
  tick: number;
  snakes: Snake[];
  fruits: Fruit[];
  obstacles: Position[];
  scores: Record<SnakeId, number>;
  fruitsEatenThisLevel: number;
  fruitsRequiredThisLevel: number;
  efficiencyStreak: number;
  boosted: boolean;
  speedMs: number;
  survivor: SnakeId | null;
}

/** Minimal context the fruit spawner needs (a full GameState satisfies it). */
type SpawnContext = Pick<GameState, 'snakes' | 'obstacles' | 'fruits' | 'tick'>;

const inBounds = (p: Position): boolean =>
  p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;

function makeSnake(
  id: SnakeId,
  head: Position,
  direction: Direction,
): Snake {
  // Body extends backwards from the head opposite to the heading (heading RIGHT
  // → body to the left).
  const back = opposite(direction);
  const body: Position[] = [head];
  for (let i = 1; i < INITIAL_SNAKE_LENGTH; i++) {
    body.push(move(body[i - 1], back));
  }
  return { id, body, direction, pendingTurn: null, pendingGrowth: 0, alive: true };
}

function opposite(direction: Direction): Direction {
  return rotate(rotate(direction, 'CW'), 'CW');
}

function pickFruitType(rng: () => number): FruitTypeValue {
  const types = Object.values(FruitType);
  const total = types.reduce((sum, t) => sum + FRUIT_SPAWN_WEIGHT[t], 0);
  let roll = rng() * total;
  for (const t of types) {
    roll -= FRUIT_SPAWN_WEIGHT[t];
    if (roll < 0) return t;
  }
  return types[types.length - 1];
}

/** Pick a random empty cell and return a new regular fruit on it. */
export function spawnFruit(ctx: SpawnContext, rng: () => number = Math.random): Fruit {
  const occupied = new Set<string>();
  for (const snake of ctx.snakes) {
    for (const segment of snake.body) occupied.add(posKey(segment));
  }
  for (const o of ctx.obstacles) occupied.add(posKey(o));
  for (const f of ctx.fruits) occupied.add(posKey(f.position));

  const empty: Position[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(posKey({ x, y }))) empty.push({ x, y });
    }
  }
  const position = empty[Math.floor(rng() * empty.length)] ?? { x: 0, y: 0 };
  return {
    id: crypto.randomUUID(),
    type: pickFruitType(rng),
    position,
    spawnTick: ctx.tick,
    isBonus: false,
  };
}

const regularCount = (fruits: Fruit[]): number =>
  fruits.filter((f) => !f.isBonus).length;

/** Build a fresh IDLE state for a mode: snakes placed, obstacles and fruit spawned. */
export function createInitialState(
  mode: GameModeValue,
  rng: () => number = Math.random,
): GameState {
  const mid = Math.floor(GRID_SIZE / 2);
  const snakes: Snake[] =
    mode === GameMode.VERSUS
      ? [
          makeSnake(SNAKE_ID.PLAYER, { x: 5, y: mid + 4 }, 'RIGHT'),
          makeSnake(SNAKE_ID.MACHINE, { x: 5, y: mid - 4 }, 'RIGHT'),
        ]
      : [makeSnake(SNAKE_ID.PLAYER, { x: 5, y: mid }, 'RIGHT')];

  const obstacles = generateObstacles({ snakes }, rng);

  const target = mode === GameMode.VERSUS ? VERSUS_FRUIT_COUNT : SIMPLE_FRUIT_COUNT;
  let fruits: Fruit[] = [];
  while (regularCount(fruits) < target) {
    fruits = [...fruits, spawnFruit({ snakes, obstacles, fruits, tick: 0 }, rng)];
  }

  return {
    status: GameStatus.IDLE,
    mode,
    level: 1,
    tick: 0,
    snakes,
    fruits,
    obstacles,
    scores: { player: 0, machine: 0 },
    fruitsEatenThisLevel: 0,
    fruitsRequiredThisLevel: fruitsRequired(1),
    efficiencyStreak: 0,
    boosted: false,
    speedMs: speedForLevel(1),
    survivor: null,
  };
}

/** Buffer a turn for a snake. Only the first turn per tick interval is kept. */
export function queueTurn(
  state: GameState,
  snakeId: SnakeId,
  rotation: Rotation,
): GameState {
  return {
    ...state,
    snakes: state.snakes.map((s) =>
      s.id === snakeId && s.pendingTurn === null ? { ...s, pendingTurn: rotation } : s,
    ),
  };
}

/** Advance the game one tick. Pure: same input always yields the same shape. */
export function advanceTick(state: GameState, rng: () => number = Math.random): GameState {
  const tick = state.tick + 1;
  const multiplier =
    state.mode === GameMode.VERSUS ? VERSUS_MULTIPLIER : SIMPLE_MULTIPLIER;

  // 1. Resolve headings (apply at most one buffered turn) and clear the buffer.
  const directed = state.snakes.map((s) =>
    s.alive && s.pendingTurn
      ? { ...s, direction: rotate(s.direction, s.pendingTurn), pendingTurn: null }
      : { ...s, pendingTurn: null },
  );

  // 2. Next head for each alive snake.
  const nextHead = directed.map((s) => (s.alive ? move(s.body[0], s.direction) : null));

  // 3. Fruit eaten by each snake (head moving onto a fruit cell).
  const eaten = directed.map((_snake, i) => {
    const h = nextHead[i];
    if (!h) return null;
    return state.fruits.find((f) => samePos(f.position, h)) ?? null;
  });

  // 4. A snake grows this tick if it eats or has queued growth; growing snakes
  //    keep their tail, so the tail cell still blocks.
  const grows = directed.map((s, i) => eaten[i] != null || s.pendingGrowth > 0);
  const blockers = new Set<string>();
  directed.forEach((s, i) => {
    const cells = grows[i] ? s.body : s.body.slice(0, s.body.length - 1);
    cells.forEach((p) => blockers.add(posKey(p)));
  });

  // 5. Deaths: wall, obstacle, a body cell that stays, or a head-to-head.
  const dead = directed.map((s, i) => {
    if (!s.alive) return true;
    const h = nextHead[i]!;
    if (!inBounds(h)) return true;
    if (state.obstacles.some((o) => samePos(o, h))) return true;
    if (blockers.has(posKey(h))) return true;
    for (let j = 0; j < directed.length; j++) {
      if (j !== i && nextHead[j] && samePos(nextHead[j]!, h)) return true;
    }
    return false;
  });

  // 6. Move the snakes that survived; freeze the rest.
  const newSnakes = directed.map((s, i) => {
    if (dead[i] || !s.alive) return { ...s, alive: false };
    const newBody = [nextHead[i]!, ...s.body];
    let pendingGrowth = s.pendingGrowth;
    if (grows[i]) {
      if (!eaten[i]) pendingGrowth -= 1; // consuming queued growth
    } else {
      newBody.pop(); // trim the tail
    }
    return { ...s, body: newBody, pendingGrowth };
  });

  // 7. Eating effects: score, fruit removal, and (player only) streak + level.
  let fruits = [...state.fruits];
  const scores = { ...state.scores };
  let level = state.level;
  let fruitsEatenThisLevel = state.fruitsEatenThisLevel;
  let fruitsRequiredThisLevel = state.fruitsRequiredThisLevel;
  let efficiencyStreak = state.efficiencyStreak;
  let spawnGolden = false;

  directed.forEach((s, i) => {
    const fruit = eaten[i];
    if (dead[i] || !fruit) return;
    const elapsed = tick - fruit.spawnTick;
    const base = fruit.isBonus ? GOLDEN_BASE_VALUE : FRUIT_BASE_VALUE[fruit.type];
    scores[s.id] += fruitPoints(base, elapsed, multiplier, fruit.isBonus);
    fruits = fruits.filter((f) => f.id !== fruit.id);

    if (s.id === SNAKE_ID.PLAYER) {
      const decay = fruit.isBonus ? 1 : decayFactor(elapsed);
      const streakResult = updateStreak(efficiencyStreak, decay, fruit.isBonus);
      efficiencyStreak = streakResult.streak;
      if (streakResult.spawnBonus) spawnGolden = true;

      // Only regular fruits advance the level.
      if (!fruit.isBonus) {
        fruitsEatenThisLevel += 1;
        if (fruitsEatenThisLevel >= fruitsRequiredThisLevel) {
          level += 1;
          fruitsEatenThisLevel = 0;
          fruitsRequiredThisLevel = fruitsRequired(level);
        }
      }
    }
  });

  // 8. Maintain the regular fruit count and add any golden bonus fruit.
  const target = state.mode === GameMode.VERSUS ? VERSUS_FRUIT_COUNT : SIMPLE_FRUIT_COUNT;
  const context: SpawnContext = {
    snakes: newSnakes,
    obstacles: state.obstacles,
    fruits,
    tick,
  };
  while (regularCount(fruits) < target) {
    fruits = [...fruits, spawnFruit({ ...context, fruits }, rng)];
  }
  if (spawnGolden) {
    const golden = spawnFruit({ ...context, fruits }, rng);
    fruits = [...fruits, { ...golden, isBonus: true }];
  }

  // 9. Status and the Versus survivor bonus.
  let status = state.status;
  let survivor = state.survivor;
  const player = newSnakes.find((s) => s.id === SNAKE_ID.PLAYER)!;
  const gameOver =
    state.mode === GameMode.VERSUS
      ? newSnakes.some((s) => !s.alive)
      : !player.alive;

  if (gameOver) {
    status = GameStatus.GAME_OVER;
    if (state.mode === GameMode.VERSUS) {
      const alive = newSnakes.filter((s) => s.alive);
      if (alive.length === 1) {
        survivor = alive[0].id;
        scores[survivor] = Math.round(scores[survivor] * SURVIVOR_BONUS);
      } else {
        survivor = null;
      }
    }
  }

  // 10. Current tick interval from the (possibly new) level and boost state.
  const normalSpeed = speedForLevel(level);
  const speedMs = state.boosted ? Math.round(normalSpeed / BOOST_FACTOR) : normalSpeed;

  return {
    ...state,
    status,
    tick,
    level,
    snakes: newSnakes,
    fruits,
    scores,
    fruitsEatenThisLevel,
    fruitsRequiredThisLevel,
    efficiencyStreak,
    speedMs,
    survivor,
  };
}
