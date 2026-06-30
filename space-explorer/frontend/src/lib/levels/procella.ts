import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import { composeHeightmap, segmentCenter, type TerrainSegment } from './builder';

// Level 10 — Procella. Wind-blasted high-gravity world, no tools. Four samples on
// narrow flats between tall jagged peaks — a pure precision-landing test.

const SEGMENTS: TerrainSegment[] = [
  { width: 60, from: 220 }, // 0: flat (sample 1)
  { width: 110, from: 220, to: 400 }, // 1: peak up
  { width: 110, from: 400, to: 200 }, // 2: down
  { width: 50, from: 200 }, // 3: narrow flat (sample 2)
  { width: 120, from: 200, to: 420 }, // 4: peak up
  { width: 120, from: 420, to: 180 }, // 5: down
  { width: 50, from: 180 }, // 6: narrow flat (sample 3)
  { width: 120, from: 180, to: 380 }, // 7: peak up
  { width: 120, from: 380, to: 210 }, // 8: down
  { width: 60, from: 210 }, // 9: flat (sample 4)
  { width: 110, from: 210, to: 150 }, // 10: descent
  { width: 100, from: 150 }, // 11: open flat tail
];

export const PROCELLA: LevelConfig = {
  id: 10,
  name: 'Procella',
  worldType: WorldType.STORM,
  distanceFromEarth: '63.7 light years',
  gravity: 1.5,
  fuel: 1500,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [],
  samples: [
    { id: 'procella-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'procella-2', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false },
    { id: 'procella-3', columnIndex: segmentCenter(SEGMENTS, 6), subsurface: false },
    { id: 'procella-4', columnIndex: segmentCenter(SEGMENTS, 9), subsurface: false },
  ],
  theme: {
    skyColorTop: '#14181f',
    skyColorBottom: '#3a4250',
    groundColor: '#4a5260',
    waterColor: '#2a313c',
  },
};
