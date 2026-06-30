import type { LevelConfig } from './types';
import { WorldType, SampleShape } from '../constants';
import { composeHeightmap, segmentCenter, type TerrainSegment } from './builder';

// Level 4 — Aridus. Arid dune world, no water, no tools. Three land samples on
// flats between tall dunes. A pure-flight planet after Glacius's tool puzzles.

const SEGMENTS: TerrainSegment[] = [
  { width: 70, from: 200 }, // 0: flat start (sample 1)
  { width: 140, from: 200, to: 320 }, // 1: dune up
  { width: 140, from: 320, to: 180 }, // 2: dune down
  { width: 70, from: 180 }, // 3: flat (sample 2)
  { width: 150, from: 180, to: 360 }, // 4: big dune up
  { width: 150, from: 360, to: 160 }, // 5: down
  { width: 70, from: 160 }, // 6: flat (sample 3)
  { width: 130, from: 160, to: 230 }, // 7: tail rise
  { width: 100, from: 230 }, // 8: open flat tail
];

export const ARIDUS: LevelConfig = {
  id: 4,
  name: 'Aridus',
  worldType: WorldType.DESERT,
  distanceFromEarth: '21.0 light years',
  gravity: 1.0,
  fuel: 1100,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [],
  samples: [
    { id: 'aridus-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false, shape: SampleShape.ROCK },
    { id: 'aridus-2', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false, shape: SampleShape.NUGGET },
    { id: 'aridus-3', columnIndex: segmentCenter(SEGMENTS, 6), subsurface: false, shape: SampleShape.ROCK },
  ],
  theme: {
    skyColorTop: '#2b1a2e',
    skyColorBottom: '#c9883a',
    groundColor: '#c2a35a',
    waterColor: '#7a5a30',
  },
};
