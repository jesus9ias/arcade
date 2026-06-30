import type { LevelConfig } from './types';
import { WorldType, SampleShape } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 12 — Terminus. The final world: extreme gravity, both tools, two lakes
// and six samples (two land, two underwater, two buried). The full toolkit under
// the harshest conditions.

const SEGMENTS: TerrainSegment[] = [
  { width: 80, from: 190 }, // 0: flat (sample 1, land)
  { width: 110, from: 190, to: 330 }, // 1: rise
  { width: 110, from: 330, to: 150 }, // 2: down
  { width: 80, from: 150 }, // 3: plateau (sample 5, subsurface)
  { width: 110, from: 150, to: 80 }, // 4: into lake A
  { width: 190, from: 80 }, // 5: lake A floor (sample 3, underwater)
  { width: 100, from: 80, to: 200 }, // 6: out of lake A
  { width: 110, from: 200, to: 320 }, // 7: ridge up
  { width: 110, from: 320, to: 160 }, // 8: down
  { width: 80, from: 160 }, // 9: plateau (sample 6, subsurface)
  { width: 110, from: 160, to: 250 }, // 10: rise
  { width: 60, from: 250 }, // 11: flat (sample 2, land)
  { width: 120, from: 250, to: 90 }, // 12: into lake B
  { width: 200, from: 90 }, // 13: lake B floor (sample 4, underwater)
  { width: 100, from: 90, to: 200 }, // 14: out of lake B
  { width: 110, from: 200 }, // 15: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const TERMINUS: LevelConfig = {
  id: 12,
  name: 'Terminus',
  worldType: WorldType.FROZEN,
  distanceFromEarth: '88.9 light years',
  gravity: 1.6,
  fuel: 2000,
  electricity: 700,
  tools: { laser: true, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    { startColumn: STARTS[4], endColumn: STARTS[7] - 1, surfaceHeight: 140 },
    { startColumn: STARTS[12], endColumn: STARTS[15] - 1, surfaceHeight: 160 },
  ],
  samples: [
    { id: 'terminus-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false, shape: SampleShape.SHARD },
    { id: 'terminus-2', columnIndex: segmentCenter(SEGMENTS, 11), subsurface: false, shape: SampleShape.SHARD },
    { id: 'terminus-3', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false, shape: SampleShape.SHARD },
    { id: 'terminus-4', columnIndex: segmentCenter(SEGMENTS, 13), subsurface: false, shape: SampleShape.SHARD },
    // Two buried samples — laser each plateau open.
    { id: 'terminus-5', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: true, shape: SampleShape.CRYSTAL },
    { id: 'terminus-6', columnIndex: segmentCenter(SEGMENTS, 9), subsurface: true, shape: SampleShape.CRYSTAL },
  ],
  theme: {
    skyColorTop: '#0a1a2a',
    skyColorBottom: '#4a7a9a',
    groundColor: '#cfe0ea',
    waterColor: '#9fd0e6',
  },
};
