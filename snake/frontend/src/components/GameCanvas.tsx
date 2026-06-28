import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GRID_SIZE,
  CELL_PIXELS,
  CELL_PADDING,
  BOARD_PALETTE,
  FRUIT_COLOR,
  GOLDEN_FRUIT_COLOR,
  SNAKE_ID,
} from '../lib/constants';
import type { Theme as ThemeValue, Rotation, Position } from '../lib/constants';
import type { GameState, Snake, Fruit } from '../lib/engine/engine';
import { getFruitSprites } from './fruitSprites';
import type { SpriteKey } from './fruitSprites';

const CANVAS_SIZE = GRID_SIZE * CELL_PIXELS;
const PAD = CELL_PIXELS * CELL_PADDING;

type Sprites = Map<SpriteKey, HTMLImageElement>;

function fillCell(
  ctx: CanvasRenderingContext2D,
  p: Position,
  color: string,
  inset = PAD,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(
    p.x * CELL_PIXELS + inset,
    p.y * CELL_PIXELS + inset,
    CELL_PIXELS - inset * 2,
    CELL_PIXELS - inset * 2,
  );
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  palette: (typeof BOARD_PALETTE)[ThemeValue],
): void {
  const isPlayer = snake.id === SNAKE_ID.PLAYER;
  const body = isPlayer ? palette.player : palette.machine;
  const head = isPlayer ? palette.playerHead : palette.machineHead;
  snake.body.forEach((segment, index) => {
    fillCell(ctx, segment, index === 0 ? head : body);
  });
}

function drawFruit(ctx: CanvasRenderingContext2D, fruit: Fruit, sprites: Sprites): void {
  const key: SpriteKey = fruit.isBonus ? 'GOLDEN' : fruit.type;
  const sprite = sprites.get(key);
  const x = fruit.position.x * CELL_PIXELS;
  const y = fruit.position.y * CELL_PIXELS;

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, x + 1, y + 1, CELL_PIXELS - 2, CELL_PIXELS - 2);
    return;
  }

  // Fallback while the sprite is still decoding.
  ctx.beginPath();
  ctx.arc(x + CELL_PIXELS / 2, y + CELL_PIXELS / 2, CELL_PIXELS / 2 - PAD, 0, Math.PI * 2);
  ctx.fillStyle = fruit.isBonus ? GOLDEN_FRUIT_COLOR : FRUIT_COLOR[fruit.type];
  ctx.fill();
}

function draw(
  canvas: HTMLCanvasElement,
  game: GameState,
  theme: ThemeValue,
  sprites: Sprites,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = BOARD_PALETTE[theme];

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    const offset = i * CELL_PIXELS + 0.5;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, CANVAS_SIZE);
    ctx.moveTo(0, offset);
    ctx.lineTo(CANVAS_SIZE, offset);
    ctx.stroke();
  }

  for (const obstacle of game.obstacles) fillCell(ctx, obstacle, palette.obstacle, PAD / 2);
  for (const fruit of game.fruits) drawFruit(ctx, fruit, sprites);
  for (const snake of game.snakes) drawSnake(ctx, snake, palette);
}

interface GameCanvasProps {
  game: GameState;
  theme: ThemeValue;
  onTurn: (rotation: Rotation) => void;
}

export function GameCanvas({ game, theme, onTurn }: GameCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<Sprites>(new Map());
  const [spritesReady, setSpritesReady] = useState(0);
  const { t } = useTranslation();

  // Create the sprites once; bump a counter as each finishes so we redraw.
  useEffect(() => {
    spritesRef.current = getFruitSprites(() => setSpritesReady((v) => v + 1));
  }, []);

  useEffect(() => {
    if (ref.current) draw(ref.current, game, theme, spritesRef.current);
  }, [game, theme, spritesReady]);

  // Tap the left half to turn counter-clockwise, the right half clockwise.
  const handlePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    onTurn(x < rect.width / 2 ? 'CCW' : 'CW');
  };

  // iOS Safari does not reliably fire pointerdown on canvas elements; use touchstart as fallback.
  const handleTouch = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    onTurn(x < rect.width / 2 ? 'CCW' : 'CW');
  };

  return (
    <canvas
      ref={ref}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="board-canvas"
      onPointerDown={handlePointer}
      onTouchStart={handleTouch}
      role="img"
      aria-label={t('game.title')}
    />
  );
}
