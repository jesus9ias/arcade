import type { LevelConfig } from './types';
import { WorldType, SampleShape } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 8 — Toxina. Corrosive world with an acid lake. Turbines let the rover
// dive for the submerged sample; three more sit on land.

const SEGMENTS: TerrainSegment[] = [
  { width: 90, from: 180 }, // 0: flat (sample 1, land)
  { width: 120, from: 180, to: 300 }, // 1: rise
  { width: 120, from: 300, to: 160 }, // 2: down
  { width: 60, from: 160 }, // 3: flat (sample 2, land)
  { width: 100, from: 160, to: 80 }, // 4: into the acid lake
  { width: 200, from: 80 }, // 5: lake floor (sample 4, underwater)
  { width: 100, from: 80, to: 180 }, // 6: out of the lake
  { width: 120, from: 180, to: 280 }, // 7: rise
  { width: 60, from: 280 }, // 8: plateau (sample 3, land)
  { width: 150, from: 280, to: 170 }, // 9: descent
  { width: 110, from: 170 }, // 10: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const TOXINA: LevelConfig = {
  id: 8,
  name: 'Toxina',
  worldType: WorldType.TOXIC,
  distanceFromEarth: '48.6 light years',
  gravity: 1.0,
  fuel: 1200,
  electricity: 500,
  tools: { laser: false, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [{ startColumn: STARTS[4], endColumn: STARTS[7] - 1, surfaceHeight: 140 }],
  samples: [
    { id: 'toxina-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false, shape: SampleShape.GLOB },
    { id: 'toxina-2', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false, shape: SampleShape.GLOB },
    { id: 'toxina-3', columnIndex: segmentCenter(SEGMENTS, 8), subsurface: false, shape: SampleShape.GLOB },
    { id: 'toxina-4', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false, shape: SampleShape.GLOB },
  ],
  theme: {
    skyColorTop: '#16210a',
    skyColorBottom: '#4a6e1f',
    groundColor: '#5a6a2a',
    waterColor: '#8fbf2f',
  },
};
