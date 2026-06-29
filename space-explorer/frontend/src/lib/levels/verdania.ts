import type { LevelConfig } from './types';
import { composeHeightmap, segmentCenter, type TerrainSegment } from './builder';

// Level 1 — Verdania. Gentle rolling hills, two ample flat landing zones, no
// water, low gravity. The tutorial planet.

const SEGMENTS: TerrainSegment[] = [
  { width: 90, from: 120, to: 170 }, // 0: rolling rise
  { width: 110, from: 170 }, // 1: flat landing zone A (sample 1)
  { width: 150, from: 170, to: 110 }, // 2: descent
  { width: 130, from: 110, to: 220 }, // 3: climb to a hill
  { width: 120, from: 220 }, // 4: flat landing zone B (sample 2)
  { width: 150, from: 220, to: 150 }, // 5: descent
  { width: 110, from: 150 }, // 6: open flat tail
];

export const VERDANIA: LevelConfig = {
  id: 1,
  name: 'Verdania',
  distanceFromEarth: '4.2 light years',
  gravity: 0.5,
  fuel: 1200,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [],
  samples: [
    { id: 'verdania-1', columnIndex: segmentCenter(SEGMENTS, 1), subsurface: false },
    { id: 'verdania-2', columnIndex: segmentCenter(SEGMENTS, 4), subsurface: false },
  ],
  theme: {
    skyColorTop: '#1a1346',
    skyColorBottom: '#4a2a6b',
    groundColor: '#6f7d3a',
    waterColor: '#2a4d6b',
  },
};
