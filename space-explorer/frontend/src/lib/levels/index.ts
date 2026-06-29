export * from './types';
export { composeHeightmap, segmentCenter, segmentStarts } from './builder';
export type { TerrainSegment } from './builder';

import type { LevelConfig } from './types';
import { VERDANIA } from './verdania';
import { FERRUM } from './ferrum';
import { GLACIUS } from './glacius';

/** All playable levels, in unlock order. Adding a planet = adding a config here. */
export const LEVELS: ReadonlyArray<LevelConfig> = [VERDANIA, FERRUM, GLACIUS];

export { VERDANIA, FERRUM, GLACIUS };

/** Returns the level with the given id, or undefined when none matches. */
export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

/** The last (highest-id) level; used to detect end-of-game. */
export function lastLevelId(): number {
  return LEVELS[LEVELS.length - 1].id;
}
