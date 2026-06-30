// Mineral-sample shapes. Purely cosmetic: every sample is still a point at its
// flat-zone center with identical collection rules — these polygons only change
// how the marker is drawn so each planet's samples look like fitting minerals
// (jagged rock, faceted crystal, ice shard, metal nugget, …). A level assigns a
// shape per sample (see SampleConfig.shape); the renderer scales the normalized
// vertices below by SAMPLE_MARKER_RADIUS. No game logic depends on the shape.

import type { Vector2 } from './game';

export const SampleShape = {
  ROCK: 'ROCK', // angular rocky chunk — barren / desert / oceanic worlds
  CRYSTAL: 'CRYSTAL', // tall faceted gem — crystalline worlds
  SHARD: 'SHARD', // sharp splintered shard — frozen worlds
  NUGGET: 'NUGGET', // lumpy rounded ore — metallic worlds
  EMBER: 'EMBER', // spiky scorched fragment — volcanic / storm worlds
  POD: 'POD', // organic rounded blob — verdant worlds
  GLOB: 'GLOB', // wobbly viscous glob — toxic worlds
} as const;
export type SampleShape = (typeof SampleShape)[keyof typeof SampleShape];

/** Fallback when a sample declares no shape (keeps older fixtures rendering). */
export const DEFAULT_SAMPLE_SHAPE: SampleShape = SampleShape.ROCK;

/**
 * Characteristic fill colour per mineral shape. A buried (unexposed) sample
 * overrides this with SAMPLE_SUBSURFACE_COLOR to keep the "fire the laser here"
 * signal; once exposed it falls back to its natural colour below.
 */
export const SAMPLE_SHAPE_COLOR: Record<SampleShape, string> = {
  ROCK: '#caa472', // tan stone
  CRYSTAL: '#6fe3ff', // cyan gem
  SHARD: '#cfeaff', // pale ice
  NUGGET: '#ffce4a', // gold ore
  EMBER: '#ff6a3d', // molten orange
  POD: '#7ed957', // organic green
  GLOB: '#c6ff3a', // acid yellow-green
};

/**
 * Normalized vertices per shape, roughly within the unit circle. The renderer
 * multiplies each by SAMPLE_MARKER_RADIUS and offsets by the marker center, so
 * every shape fills the same footprint a circular marker used to occupy.
 */
export const SAMPLE_SHAPE_POINTS: Record<SampleShape, Vector2[]> = {
  ROCK: [
    { x: -0.9, y: -0.1 },
    { x: -0.5, y: -0.8 },
    { x: 0.3, y: -0.95 },
    { x: 0.95, y: -0.2 },
    { x: 0.7, y: 0.7 },
    { x: -0.2, y: 0.95 },
    { x: -0.85, y: 0.5 },
  ],
  CRYSTAL: [
    { x: 0.0, y: -1.1 },
    { x: 0.5, y: -0.2 },
    { x: 0.35, y: 0.95 },
    { x: -0.4, y: 0.95 },
    { x: -0.55, y: -0.15 },
  ],
  SHARD: [
    { x: -0.2, y: -1.1 },
    { x: 0.4, y: -0.3 },
    { x: 0.9, y: 0.1 },
    { x: 0.3, y: 0.5 },
    { x: 0.5, y: 1.0 },
    { x: -0.3, y: 0.7 },
    { x: -0.8, y: 0.2 },
    { x: -0.5, y: -0.4 },
  ],
  NUGGET: [
    { x: -0.7, y: -0.5 },
    { x: 0.0, y: -0.85 },
    { x: 0.75, y: -0.45 },
    { x: 0.95, y: 0.25 },
    { x: 0.45, y: 0.85 },
    { x: -0.35, y: 0.8 },
    { x: -0.9, y: 0.3 },
    { x: -0.95, y: -0.2 },
  ],
  EMBER: [
    { x: -0.3, y: -1.0 },
    { x: 0.1, y: -0.5 },
    { x: 0.7, y: -0.7 },
    { x: 0.5, y: 0.0 },
    { x: 1.0, y: 0.4 },
    { x: 0.3, y: 0.6 },
    { x: 0.4, y: 1.0 },
    { x: -0.2, y: 0.6 },
    { x: -0.7, y: 0.85 },
    { x: -0.6, y: 0.1 },
    { x: -1.0, y: -0.2 },
    { x: -0.45, y: -0.5 },
  ],
  POD: [
    { x: -0.6, y: -0.7 },
    { x: 0.2, y: -0.95 },
    { x: 0.85, y: -0.4 },
    { x: 0.8, y: 0.45 },
    { x: 0.25, y: 0.9 },
    { x: -0.5, y: 0.8 },
    { x: -0.9, y: 0.15 },
    { x: -0.75, y: -0.45 },
  ],
  GLOB: [
    { x: -0.8, y: -0.3 },
    { x: -0.3, y: -0.85 },
    { x: 0.4, y: -0.6 },
    { x: 0.85, y: -0.85 },
    { x: 0.7, y: 0.0 },
    { x: 0.95, y: 0.55 },
    { x: 0.2, y: 0.7 },
    { x: -0.1, y: 1.0 },
    { x: -0.55, y: 0.6 },
    { x: -0.95, y: 0.2 },
  ],
};
