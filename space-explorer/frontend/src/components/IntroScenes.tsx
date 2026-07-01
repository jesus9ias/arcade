// The intro's scene set. Each scene is a self-contained, full-bleed SVG picked
// by the IntroScene manager based on the current paragraph. Presentation only —
// aria-hidden is applied by the manager wrapper. All motion is CSS-driven and
// disabled under prefers-reduced-motion.

import IntroShip from './IntroShip';
import { INTRO_STAR_COUNT } from '../lib/constants';

// --- shared helpers ------------------------------------------------------

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  layer: number; // 0 = far (small, drifts less), 1 = near (larger, drifts more)
}

/** Deterministic pseudo-random in [0, 1) — the classic fract(sin·k) hash. Unlike
 *  a linear `(n·k) % m`, it disperses values without a visible lattice/pairing. */
function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

/** Scattered star field across the 0–100 viewBox. Deterministic (stable renders,
 *  no hydration surprises) but pattern-free; `seed` gives each scene its own sky. */
function makeStars(count: number, seed = 0): Star[] {
  const stars: Star[] = [];
  const base = seed * 100 + 1;
  for (let i = 0; i < count; i += 1) {
    const n = base + i;
    const r = 0.25 + hash(n * 3.17 + 1.3) * 0.7;
    stars.push({
      x: hash(n * 12.9898) * 100,
      y: hash(n * 78.233 + 4.1) * 100,
      r,
      delay: hash(n * 5.71 + 2.9) * 4,
      layer: r < 0.6 ? 0 : 1, // smaller stars sit farther away
    });
  }
  return stars;
}

/** Stars split into a far and a near layer that drift at different rates, giving
 *  a subtle parallax depth. Twinkle lives on each star; drift on the layer. */
function Stars({ count, seed }: { count: number; seed?: number }) {
  const all = makeStars(count, seed);
  const layer = (n: number) =>
    all
      .filter((s) => s.layer === n)
      .map((s, i) => (
        <circle
          key={i}
          className="intro-star"
          cx={s.x}
          cy={s.y}
          r={s.r}
          style={{ animationDelay: `${s.delay}s` }}
        />
      ));
  return (
    <>
      <g className="intro-stars intro-stars--far">{layer(0)}</g>
      <g className="intro-stars intro-stars--near">{layer(1)}</g>
    </>
  );
}

/** A rough irregular continent/land blob centred at (cx+ox·r, cy+oy·r). */
function landPath(cx: number, cy: number, r: number, ox: number, oy: number, s: number): string {
  const bx = cx + ox * r;
  const by = cy + oy * r;
  const br = s * r;
  const pts: [number, number][] = [
    [0.9, -0.3],
    [0.5, -0.95],
    [-0.15, -0.7],
    [-0.85, -0.25],
    [-0.6, 0.55],
    [0.1, 0.85],
    [0.75, 0.45],
  ];
  return (
    pts
      .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${(bx + px * br).toFixed(1)} ${(by + py * br).toFixed(1)}`)
      .join(' ') + ' Z'
  );
}

interface PlanetProps {
  id: string;
  cx: number;
  cy: number;
  r: number;
  kind: 'earth' | 'rock' | 'gas';
}

/** A planet with surface relief and a soft terminator shadow, clipped to its disc. */
function Planet({ id, cx, cy, r, kind }: PlanetProps) {
  const clip = `intro-clip-${id}`;
  return (
    <g className="intro-planet2">
      {kind === 'earth' && (
        <circle className="intro-planet2__glow" cx={cx} cy={cy} r={r * 1.1} />
      )}
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <circle className={`intro-planet2__base intro-planet2__base--${kind}`} cx={cx} cy={cy} r={r} />

        {kind === 'earth' && (
          <>
            <path className="intro-planet2__land" d={landPath(cx, cy, r, -0.25, -0.15, 0.55)} />
            <path className="intro-planet2__land" d={landPath(cx, cy, r, 0.4, 0.35, 0.4)} />
            <path className="intro-planet2__land" d={landPath(cx, cy, r, -0.45, 0.5, 0.28)} />
          </>
        )}

        {kind === 'rock' && (
          <>
            <circle className="intro-planet2__crater" cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.22} />
            <circle className="intro-planet2__crater" cx={cx + r * 0.35} cy={cy + r * 0.28} r={r * 0.16} />
            <circle className="intro-planet2__crater" cx={cx + r * 0.12} cy={cy - r * 0.45} r={r * 0.12} />
            <circle className="intro-planet2__crater" cx={cx - r * 0.5} cy={cy + r * 0.35} r={r * 0.1} />
          </>
        )}

        {kind === 'gas' && (
          <>
            <ellipse className="intro-planet2__band" cx={cx} cy={cy - r * 0.4} rx={r} ry={r * 0.16} />
            <ellipse className="intro-planet2__band intro-planet2__band--dark" cx={cx} cy={cy - r * 0.05} rx={r} ry={r * 0.12} />
            <ellipse className="intro-planet2__band" cx={cx} cy={cy + r * 0.3} rx={r} ry={r * 0.2} />
            <ellipse className="intro-planet2__band intro-planet2__band--dark" cx={cx} cy={cy + r * 0.62} rx={r} ry={r * 0.12} />
          </>
        )}

        {/* Terminator shadow: an offset dark disc clipped to the planet, giving depth. */}
        <circle className="intro-planet2__shadow" cx={cx + r * 0.42} cy={cy + r * 0.32} r={r} />
      </g>
    </g>
  );
}

// --- scenes --------------------------------------------------------------

/** Scene 0 — the cosmos on the start screen: stars + several relief planets. */
export function SpaceScene() {
  return (
    <svg className="intro-scene__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <Stars count={INTRO_STAR_COUNT} />
      <Planet id="sp-earth" cx={20} cy={30} r={12} kind="earth" />
      <Planet id="sp-rock" cx={80} cy={20} r={8} kind="rock" />
      <Planet id="sp-gas" cx={74} cy={78} r={16} kind="gas" />
      <Planet id="sp-moon" cx={44} cy={62} r={4} kind="rock" />
    </svg>
  );
}

const CITY_BUILDINGS: { x: number; w: number; h: number }[] = [
  { x: 2, w: 9, h: 26 },
  { x: 12, w: 7, h: 40 },
  { x: 20, w: 10, h: 33 },
  { x: 31, w: 6, h: 52 },
  { x: 38, w: 9, h: 44 },
  { x: 48, w: 7, h: 62 },
  { x: 56, w: 10, h: 38 },
  { x: 67, w: 6, h: 50 },
  { x: 74, w: 9, h: 30 },
  { x: 84, w: 7, h: 46 },
  { x: 92, w: 8, h: 34 },
];

interface CityWindow {
  x: number;
  y: number;
  dim: boolean;
  delay: number;
}

/** Lit windows for a building: a varied count (some 2, some 3–4+), arranged in a
 *  small grid, with a deterministic subset that switches off as night falls —
 *  the energy crisis biting. Positions/lights are hashed from the index so the
 *  layout is stable across renders. */
function cityWindows(b: { x: number; w: number; h: number }, i: number): CityWindow[] {
  const cols = Math.max(1, Math.min(3, Math.round(b.w / 3.2)));
  const rows = Math.max(1, Math.min(4, Math.floor(b.h / 12)));
  const marginX = b.w * 0.24;
  const stepX = cols > 1 ? (b.w - 2 * marginX) / (cols - 1) : 0;
  const topY = 100 - b.h + 5;
  const wins: CityWindow[] = [];
  let k = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      // Deterministic light density, so window counts differ between buildings.
      if ((i * 7 + r * 13 + c * 5) % 10 < 6) {
        wins.push({
          x: b.x + marginX + c * stepX,
          y: topY + r * 6,
          dim: (i * 3 + r + c) % 3 === 0, // ~a third go dark
          delay: ((i * 2 + k) % 7) * 0.6, // staggered blackout, 0–3.6s
        });
      }
      k += 1;
    }
  }
  // Never leave a building fully dark from the start.
  if (wins.length < 2) {
    wins.push({ x: b.x + marginX, y: topY, dim: false, delay: 0 });
    wins.push({ x: b.x + b.w - marginX - 1.4, y: topY + 6, dim: i % 2 === 0, delay: 1.2 });
  }
  return wins;
}

/** Scene 1 (paragraphs 1–2) — energy-crisis skyline as dusk falls to night. */
export function CityScene() {
  return (
    <svg
      className="intro-scene__svg intro-city"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="intro-city-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2c58" />
          <stop offset="0.5" stopColor="#7a4f77" />
          <stop offset="0.78" stopColor="#c77a52" />
          <stop offset="1" stopColor="#e0a25e" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#intro-city-dusk)" />
      <rect className="intro-city__night" x="0" y="0" width="100" height="100" />
      <circle className="intro-city__sun" cx="50" cy="70" r="8" />
      <g className="intro-city__stars">
        <Stars count={36} seed={4} />
      </g>

      <g className="intro-city__skyline">
        {CITY_BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect
              className="intro-city__building"
              x={b.x}
              y={100 - b.h}
              width={b.w}
              height={b.h}
            />
            {cityWindows(b, i).map((w, j) => (
              <rect
                key={j}
                className={w.dim ? 'intro-city__window intro-city__window--dim' : 'intro-city__window'}
                x={w.x}
                y={w.y}
                width="1.4"
                height="1.4"
                style={w.dim ? { animationDelay: `${w.delay}s` } : undefined}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Scene 2 (paragraphs 3–4) — leaving Earth: Earth in one corner, the Moon in
 *  the opposite one, and the ship drifting away into the star field. */
export function DepartureScene() {
  return (
    <svg className="intro-scene__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <Stars count={INTRO_STAR_COUNT} seed={2} />
      <Planet id="dep-earth" cx={4} cy={100} r={34} kind="earth" />
      <Planet id="dep-moon" cx={88} cy={12} r={9} kind="rock" />
      <g className="intro-depart-ship">
        <IntroShip />
      </g>
    </svg>
  );
}

/** Scene 3 (paragraphs 5–6) — the hopeful arrival: the ship approaches a new
 *  world (drifting toward it and growing), planet parked in a clean corner. */
export function ApproachScene() {
  return (
    <svg className="intro-scene__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <Stars count={INTRO_STAR_COUNT} seed={5} />
      <Planet id="app-world" cx={88} cy={30} r={20} kind="gas" />
      <g className="intro-approach-ship">
        <IntroShip />
      </g>
    </svg>
  );
}
