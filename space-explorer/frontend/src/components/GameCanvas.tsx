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
  ROVER_DETAIL_COLOR,
  ROVER_WINDOW_COLOR,
  ROVER_DESTROYED_BODY_COLOR,
  ROVER_DESTROYED_DETAIL_COLOR,
  FLAME_COLOR,
  FLAME_CORE_COLOR,
  TURBINE_JET_COLOR,
  TURBINE_JET_CORE_COLOR,
  SAMPLE_SUBSURFACE_COLOR,
  SAMPLE_SHAPE_POINTS,
  SAMPLE_SHAPE_COLOR,
  DEFAULT_SAMPLE_SHAPE,
  EXPLOSION_DURATION_MS,
  EXPLOSION_MAX_RADIUS,
  EXPLOSION_RAY_COUNT,
  EXPLOSION_PARTICLE_COUNT,
  EXPLOSION_CORE_COLOR,
  EXPLOSION_FLAME_COLOR,
  EXPLOSION_SHOCKWAVE_COLOR,
  EXPLOSION_DEBRIS_COLOR,
  PropulsorMode,
} from '../lib/constants';
import type { SampleShape } from '../lib/constants';
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

/** Trace an irregular sample polygon centered at (cx, cy), scaled to the marker radius. */
function traceSampleShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  shape: SampleShape,
): void {
  const points = SAMPLE_SHAPE_POINTS[shape];
  ctx.beginPath();
  points.forEach((p, i) => {
    const px = cx + p.x * SAMPLE_MARKER_RADIUS;
    const py = cy + p.y * SAMPLE_MARKER_RADIUS;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function drawSamples(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  level: LevelConfig,
  heightmap: number[],
  cam: number,
): void {
  // Shape is cosmetic level data; map it from the config by sample id.
  const shapeById = new Map(level.samples.map((s) => [s.id, s.shape ?? DEFAULT_SAMPLE_SHAPE]));
  for (const sample of state.samples) {
    // A collected sample is removed from the scene (no marker left behind).
    if (sample.collected) continue;
    const x = sample.columnIndex - cam;
    const surfaceY = SCENE_HEIGHT - getHeight(heightmap, sample.columnIndex);
    const y = surfaceY - SAMPLE_MARKER_RADIUS - 2;
    const shape = shapeById.get(sample.id) ?? DEFAULT_SAMPLE_SHAPE;
    const buried = sample.subsurface && !sample.exposed;
    traceSampleShape(ctx, x, y, shape);
    // Buried samples keep the purple "laser here" signal; once exposed they show
    // the mineral's natural colour.
    ctx.fillStyle = buried ? SAMPLE_SUBSURFACE_COLOR : SAMPLE_SHAPE_COLOR[shape];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
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

  drawRoverBody(ctx, x, y, rover.destroyed);
}

/**
 * Classic descent-probe silhouette inside the [W x H] collision box: a wide
 * "mushroom" cap (overhanging top deck) over a narrower core body, with two
 * splayed landing legs ending in footpads at the bottom corners and a central
 * thruster nozzle. All geometry is derived from ROVER_WIDTH / ROVER_HEIGHT so
 * the drawing always fills the same bounds the physics layer collides against.
 */
function drawRoverBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  destroyed: boolean,
): void {
  const W = ROVER_WIDTH;
  const H = ROVER_HEIGHT;
  const cx = x + W / 2;
  const bodyColor = destroyed ? ROVER_DESTROYED_BODY_COLOR : ROVER_BODY_COLOR;
  const detailColor = destroyed ? ROVER_DESTROYED_DETAIL_COLOR : ROVER_DETAIL_COLOR;

  // Vertical bands of the silhouette.
  const capTopY = y + H * 0.09;
  const capWidestY = y + H * 0.27;
  const capBaseY = y + H * 0.45;
  const bodyBottomY = y + H * 0.74;
  const footY = y + H;

  ctx.strokeStyle = ROVER_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  // Landing legs (drawn first so the body overlaps their upper ends).
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const legTopY = capBaseY + (bodyBottomY - capBaseY) * 0.4;
  for (const dir of [-1, 1]) {
    const innerX = cx + dir * (W * 0.18);
    const footX = cx + dir * (W * 0.5);
    ctx.beginPath();
    ctx.moveTo(innerX, legTopY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
    // Footpad.
    ctx.fillStyle = detailColor;
    ctx.fillRect(footX - W * 0.06, footY - 2, W * 0.12, 2.5);
  }

  // Thruster nozzle (bell) under the core, where the flame originates.
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.1, bodyBottomY);
  ctx.lineTo(cx + W * 0.1, bodyBottomY);
  ctx.lineTo(cx + W * 0.16, footY);
  ctx.lineTo(cx - W * 0.16, footY);
  ctx.closePath();
  ctx.fillStyle = detailColor;
  ctx.fill();
  ctx.strokeStyle = ROVER_OUTLINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Core body: narrow descent stage between the cap and the nozzle.
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.25, capBaseY);
  ctx.lineTo(cx + W * 0.25, capBaseY);
  ctx.lineTo(cx + W * 0.21, bodyBottomY);
  ctx.lineTo(cx - W * 0.21, bodyBottomY);
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mushroom cap: wide overhanging top deck, widest at its rim.
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.32, capTopY);
  ctx.lineTo(cx + W * 0.32, capTopY);
  ctx.lineTo(cx + W * 0.5, capWidestY);
  ctx.lineTo(cx + W * 0.4, capBaseY);
  ctx.lineTo(cx - W * 0.4, capBaseY);
  ctx.lineTo(cx - W * 0.5, capWidestY);
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.stroke();

  // Sensor window on the core body.
  ctx.fillStyle = destroyed ? ROVER_DESTROYED_DETAIL_COLOR : ROVER_WINDOW_COLOR;
  ctx.fillRect(cx - W * 0.12, (capBaseY + bodyBottomY) / 2 - 3, W * 0.24, 5);
}

/** Draws the full mission scene (sky → terrain → water → samples → rover). */
function renderScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  level: LevelConfig,
  thrusters: ActiveThrusters,
): void {
  const cam = cameraOffset(state, level);
  const heightmap = state.heightmap ?? level.heightmap;
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  drawSky(ctx, level);
  drawTerrain(ctx, heightmap, level, cam);
  drawWater(ctx, level, cam);
  drawSamples(ctx, state, level, heightmap, cam);
  drawRover(ctx, state, cam, thrusters);
}

interface DebrisParticle {
  angle: number; // radians, direction of travel
  speed: number; // 0..1 fraction of EXPLOSION_MAX_RADIUS reached
  size: number; // px
  spin: number; // tumble rate
}

/** One-off randomized debris set for a single explosion (cosmetic only). */
function makeDebris(): DebrisParticle[] {
  return Array.from({ length: EXPLOSION_PARTICLE_COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    size: 2 + Math.random() * 3,
    spin: (Math.random() - 0.5) * 6,
  }));
}

/** Draws the crash explosion at (cx, cy) for normalized life t in [0, 1]. */
function drawExplosion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  debris: DebrisParticle[],
): void {
  const easeOut = 1 - (1 - t) * (1 - t);
  const burst = Math.sin(Math.min(1, t * 1.3) * Math.PI); // 0 → 1 → 0 over the life
  ctx.save();

  // Expanding shockwave ring.
  ctx.globalAlpha = (1 - t) * 0.8;
  ctx.strokeStyle = EXPLOSION_SHOCKWAVE_COLOR;
  ctx.lineWidth = 3 * (1 - t) + 1;
  ctx.beginPath();
  ctx.arc(cx, cy, EXPLOSION_MAX_RADIUS * easeOut, 0, Math.PI * 2);
  ctx.stroke();

  // Flying charred debris, pulled down slightly as it flies out.
  for (const p of debris) {
    const dist = p.speed * EXPLOSION_MAX_RADIUS * easeOut;
    const px = cx + Math.cos(p.angle) * dist;
    const py = cy + Math.sin(p.angle) * dist + EXPLOSION_MAX_RADIUS * 0.5 * t * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = EXPLOSION_DEBRIS_COLOR;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.spin * t);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  // Star-burst flames that swell then collapse, with a bright core flash.
  const outer = EXPLOSION_MAX_RADIUS * (0.5 + 0.5 * easeOut) * burst;
  const inner = outer * 0.45;
  if (outer > 0.5) {
    ctx.globalAlpha = burst;
    ctx.fillStyle = EXPLOSION_FLAME_COLOR;
    ctx.beginPath();
    for (let i = 0; i < EXPLOSION_RAY_COUNT * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / EXPLOSION_RAY_COUNT;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = EXPLOSION_CORE_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function GameCanvas({ state, level }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thrustersRef = useRef<ActiveThrusters>({ bottom: false, left: false, right: false });

  // View-only key tracking for flame rendering (no game logic here).
  useEffect(() => {
    const set = (key: string, on: boolean) => {
      if (key === 'ArrowDown') thrustersRef.current.bottom = on;
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
    renderScene(ctx, state, level, thrustersRef.current);
  }, [state, level]);

  // Crash explosion: a one-shot canvas animation when the rover becomes
  // destroyed, so the loss reads as the rover blowing up. Cosmetic — it owns a
  // short rAF loop that overlays the burst on the frozen scene; the controller's
  // failure modal is delayed (in App) so the boom is seen first.
  const wasDestroyedRef = useRef(false);
  useEffect(() => {
    if (!state.rover.destroyed) {
      wasDestroyedRef.current = false;
      return;
    }
    if (wasDestroyedRef.current) return; // already played for this destruction
    wasDestroyedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cam = cameraOffset(state, level);
    const cx = state.rover.position.x - cam + ROVER_WIDTH / 2;
    const cy = state.rover.position.y + ROVER_HEIGHT / 2;
    const debris = makeDebris();
    const idle: ActiveThrusters = { bottom: false, left: false, right: false };
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / EXPLOSION_DURATION_MS);
      renderScene(ctx, state, level, idle);
      drawExplosion(ctx, cx, cy, t, debris);
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
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
