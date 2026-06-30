import type { LevelConfig } from './types';
import { WorldType, SampleShape } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 2 — Ferrum. One steep ridge and a wide valley holding a hazard lake (no
// turbines). Two sample zones on solid ground, one on a narrow ledge above the
// lake. Scene wider than the viewport — the camera tracks the rover.

const SEGMENTS: TerrainSegment[] = [
  { width: 120, from: 170 }, // 0: flat ground (sample 1)
  { width: 120, from: 170, to: 380 }, // 1: steep ridge up
  { width: 120, from: 380, to: 150 }, // 2: down toward the ledge
  { width: 40, from: 150 }, // 3: narrow ledge above the lake (sample 3)
  { width: 30, from: 150, to: 60 }, // 4: drop into the lake
  { width: 200, from: 60 }, // 5: lake floor
  { width: 30, from: 60, to: 160 }, // 6: climb out of the lake
  { width: 120, from: 160, to: 240 }, // 7: rise
  { width: 120, from: 240 }, // 8: flat plateau (sample 2)
  { width: 160, from: 240, to: 150 }, // 9: descent
  { width: 120, from: 150 }, // 10: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const FERRUM: LevelConfig = {
  id: 2,
  name: 'Ferrum',
  worldType: WorldType.VOLCANIC,
  distanceFromEarth: '8.7 light years',
  gravity: 0.9,
  fuel: 900,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    {
      // Spans the drop, floor and climb-out of the valley.
      startColumn: STARTS[4],
      endColumn: STARTS[7] - 1,
      surfaceHeight: 130,
    },
  ],
  samples: [
    { id: 'ferrum-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false, shape: SampleShape.EMBER },
    { id: 'ferrum-2', columnIndex: segmentCenter(SEGMENTS, 8), subsurface: false, shape: SampleShape.EMBER },
    { id: 'ferrum-3', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false, shape: SampleShape.ROCK },
  ],
  theme: {
    skyColorTop: '#3a1505',
    skyColorBottom: '#7a1f12',
    groundColor: '#8a3b22',
    waterColor: '#2c1a10',
  },
};
