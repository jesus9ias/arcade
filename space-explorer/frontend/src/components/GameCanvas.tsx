import { useEffect, useRef } from 'react';
import {
  SCENE_HEIGHT,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  ROVER_WIDTH,
  ROVER_HEIGHT,
  FLAME_LENGTH,
  SAMPLE_MARKER_RADIUS,
  ROVER_BODY_COLOR,
  ROVER_OUTLINE_COLOR,
  FLAME_COLOR,
  FLAME_CORE_COLOR,
  TURBINE_JET_COLOR,
  TURBINE_JET_CORE_COLOR,
  SAMPLE_COLOR,
  SAMPLE_COLLECTED_COLOR,
  SAMPLE_SUBSURFACE_COLOR,
  PropulsorMode,
} from '../lib/constants';
import type { GameState } from '../lib/constants';
import type { LevelConfig } from '../lib/levels';
import { getHeight } from '../lib/terrain/terrain';

interface Props {
  state: GameState;
  level: LevelConfig;
}

interface ActiveThrusters {
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/** Horizontal camera offset (game units). Static when the scene fits the viewport. */
function cameraOffset(state: GameState, level: LevelConfig): number {
  const sceneWidth = level.heightmap.length;
  if (sceneWidth <= VIEWPORT_WIDTH) return 0;
  const roverCenter = state.rover.position.x + ROVER_WIDTH / 2;
  const target = roverCenter - VIEWPORT_WIDTH / 2;
  return Math.min(Math.max(target, 0), sceneWidth - VIEWPORT_WIDTH);
}

function drawSky(ctx: CanvasRenderingContext2D, level: LevelConfig): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);
  gradient.addColorStop(0, level.theme.skyColorTop);
  gradient.addColorStop(1, level.theme.skyColorBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  heightmap: number[],
  level: LevelConfig,
  cam: number,
): void {
  ctx.beginPath();
  ctx.moveTo(0, VIEWPORT_HEIGHT);
  const firstCol = Math.floor(cam);
  const lastCol = Math.min(heightmap.length - 1, Math.ceil(cam + VIEWPORT_WIDTH));
  for (let col = firstCol; col <= lastCol; col++) {
    const screenX = col - cam;
    const screenY = SCENE_HEIGHT - getHeight(heightmap, col);
    ctx.lineTo(screenX, screenY);
  }
  ctx.lineTo(lastCol - cam, VIEWPORT_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = level.theme.groundColor;
  ctx.fill();
}

function drawWater(ctx: CanvasRenderingContext2D, level: LevelConfig, cam: number): void {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = level.theme.waterColor;
  for (const zone of level.waterZones) {
    const x = zone.startColumn - cam;
    const width = zone.endColumn - zone.startColumn + 1;
    const surfaceY = SCENE_HEIGHT - zone.surfaceHeight;
    ctx.fillRect(x, surfaceY, width, VIEWPORT_HEIGHT - surfaceY);
  }
  ctx.restore();
}

function drawSamples(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  heightmap: number[],
  cam: number,
): void {
  for (const sample of state.samples) {
    const x = sample.columnIndex - cam;
    const surfaceY = SCENE_HEIGHT - getHeight(heightmap, sample.columnIndex);
    const y = surfaceY - SAMPLE_MARKER_RADIUS - 2;
    const buried = sample.subsurface && !sample.exposed && !sample.collected;
    ctx.beginPath();
    ctx.arc(x, y, SAMPLE_MARKER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = sample.collected
      ? SAMPLE_COLLECTED_COLOR
      : buried
        ? SAMPLE_SUBSURFACE_COLOR
        : SAMPLE_COLOR;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ROVER_OUTLINE_COLOR;
    ctx.stroke();
    // Buried hint: a downward chevron telling the player to fire the laser here.
    if (buried) {
      ctx.beginPath();
      ctx.moveTo(x - 4, y + SAMPLE_MARKER_RADIUS + 2);
      ctx.lineTo(x + 4, y + SAMPLE_MARKER_RADIUS + 2);
      ctx.lineTo(x, y + SAMPLE_MARKER_RADIUS + 8);
      ctx.closePath();
      ctx.fillStyle = SAMPLE_SUBSURFACE_COLOR;
      ctx.fill();
    }
  }
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  dx: number,
  dy: number,
  spread: number,
  color: string,
  coreColor: string,
): void {
  // Triangle flame from a base point outwards in (dx, dy) direction.
  const tipX = fromX + dx * FLAME_LENGTH;
  const tipY = fromY + dy * FLAME_LENGTH;
  ctx.beginPath();
  ctx.moveTo(fromX - dy * spread, fromY - dx * spread);
  ctx.lineTo(fromX + dy * spread, fromY + dx * spread);
  ctx.lineTo(tipX, tipY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fromX - dy * (spread / 2), fromY - dx * (spread / 2));
  ctx.lineTo(fromX + dy * (spread / 2), fromY + dx * (spread / 2));
  ctx.lineTo(fromX + dx * (FLAME_LENGTH * 0.6), fromY + dy * (FLAME_LENGTH * 0.6));
  ctx.closePath();
  ctx.fillStyle = coreColor;
  ctx.fill();
}

function drawRover(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: number,
  thrusters: ActiveThrusters,
): void {
  const { rover } = state;
  const x = rover.position.x - cam;
  const y = rover.position.y;
  const turbineMode = rover.mode === PropulsorMode.TURBINE;

  // Effects render only where the active thruster actually produces force:
  // propulsor flames in atmosphere with fuel, turbine jets underwater with power.
  const showPropulsor = !turbineMode && rover.fuel > 0 && !rover.underwater;
  const showTurbine = turbineMode && rover.electricity > 0 && rover.underwater;
  if (showPropulsor || showTurbine) {
    const flicker = 0.7 + Math.random() * 0.3;
    const color = showTurbine ? TURBINE_JET_COLOR : FLAME_COLOR;
    const coreColor = showTurbine ? TURBINE_JET_CORE_COLOR : FLAME_CORE_COLOR;
    if (thrusters.bottom) {
      drawFlame(ctx, x + ROVER_WIDTH / 2, y + ROVER_HEIGHT, 0, flicker, ROVER_WIDTH / 3, color, coreColor);
    }
    if (thrusters.left) {
      drawFlame(ctx, x, y + ROVER_HEIGHT / 2, -flicker, 0, ROVER_HEIGHT / 3, color, coreColor);
    }
    if (thrusters.right) {
      drawFlame(ctx, x + ROVER_WIDTH, y + ROVER_HEIGHT / 2, flicker, 0, ROVER_HEIGHT / 3, color, coreColor);
    }
  }

  // Body
  ctx.fillStyle = rover.destroyed ? '#7a2a2a' : ROVER_BODY_COLOR;
  ctx.strokeStyle = ROVER_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, ROVER_WIDTH, ROVER_HEIGHT);
  ctx.strokeRect(x, y, ROVER_WIDTH, ROVER_HEIGHT);

  // Cockpit
  ctx.fillStyle = rover.destroyed ? '#3a1010' : '#5b8def';
  ctx.fillRect(x + ROVER_WIDTH / 2 - 4, y + 4, 8, 6);
}

export default function GameCanvas({ state, level }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thrustersRef = useRef<ActiveThrusters>({ bottom: false, left: false, right: false });

  // View-only key tracking for flame rendering (no game logic here).
  useEffect(() => {
    const set = (key: string, on: boolean) => {
      if (key === 'ArrowUp') thrustersRef.current.bottom = on;
      if (key === 'ArrowLeft') thrustersRef.current.left = on;
      if (key === 'ArrowRight') thrustersRef.current.right = on;
    };
    const down = (e: KeyboardEvent) => set(e.key, true);
    const up = (e: KeyboardEvent) => set(e.key, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cam = cameraOffset(state, level);
    const heightmap = state.heightmap ?? level.heightmap;
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    drawSky(ctx, level);
    drawTerrain(ctx, heightmap, level, cam);
    drawWater(ctx, level, cam);
    drawSamples(ctx, state, heightmap, cam);
    drawRover(ctx, state, cam, thrustersRef.current);
  }, [state, level]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      className="game-canvas"
      role="img"
      aria-label="Mission scene"
    />
  );
}
