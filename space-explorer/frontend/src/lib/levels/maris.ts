import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 6 — Maris. Ocean world dominated by two deep lakes. Turbines available;
// two samples sit on the lake floors (descend in turbine mode), two on land.

const SEGMENTS: TerrainSegment[] = [
  { width: 80, from: 170 }, // 0: shore flat (sample 1, land)
  { width: 90, from: 170, to: 90 }, // 1: into lake A
  { width: 200, from: 90 }, // 2: lake A floor (sample 2, underwater)
  { width: 90, from: 90, to: 180 }, // 3: out of lake A
  { width: 120, from: 180, to: 250 }, // 4: rise
  { width: 70, from: 250 }, // 5: plateau (sample 3, land)
  { width: 130, from: 250, to: 90 }, // 6: into lake B
  { width: 220, from: 90 }, // 7: lake B floor (sample 4, underwater)
  { width: 110, from: 90, to: 200 }, // 8: out of lake B
  { width: 110, from: 200 }, // 9: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const MARIS: LevelConfig = {
  id: 6,
  name: 'Maris',
  worldType: WorldType.OCEANIC,
  distanceFromEarth: '33.8 light years',
  gravity: 0.8,
  fuel: 1300,
  electricity: 600,
  tools: { laser: false, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    { startColumn: STARTS[1], endColumn: STARTS[4] - 1, surfaceHeight: 150 },
    { startColumn: STARTS[6], endColumn: STARTS[9] - 1, surfaceHeight: 160 },
  ],
  samples: [
    { id: 'maris-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'maris-2', columnIndex: segmentCenter(SEGMENTS, 2), subsurface: false },
    { id: 'maris-3', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false },
    { id: 'maris-4', columnIndex: segmentCenter(SEGMENTS, 7), subsurface: false },
  ],
  theme: {
    skyColorTop: '#06283d',
    skyColorBottom: '#1f6f8b',
    groundColor: '#3a5a6a',
    waterColor: '#2f8fb0',
  },
};
