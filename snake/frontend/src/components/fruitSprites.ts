// Generated SVG fruit sprites, pre-rendered into Image elements and drawn onto
// the canvas with drawImage. Each fruit has a recognizable silhouette; the
// golden bonus fruit is a star. Markup is static art — its colours live here,
// not in the shared constants, because they are part of the sprite, not game
// data. The SVGs are created once and cached.

import { FruitType } from '../lib/constants';
import type { FruitType as FruitTypeValue } from '../lib/constants';

export type SpriteKey = FruitTypeValue | 'GOLDEN';

const VIEWBOX = 24;

function toDataUrl(body: string): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}">${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}

const CHERRY = toDataUrl(`
  <path d="M9 7 C 11 4, 15 4, 16 8" fill="none" stroke="#5a8f3a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M16 8 q 3 -3 5 -1 q -2 3 -5 1 z" fill="#56a23a"/>
  <circle cx="8.5" cy="16" r="5" fill="#d6324a"/>
  <circle cx="16" cy="16.5" r="4.6" fill="#b71c2c"/>
  <ellipse cx="6.8" cy="14.2" rx="1.4" ry="1" fill="#ff8a9a"/>
`);

const APPLE = toDataUrl(`
  <path d="M12 7.5 C 7.5 6.5, 5 10, 6 14.5 C 7 19, 10 20.5, 12 19 C 14 20.5, 17 19, 18 14.5 C 19 10, 16.5 6.5, 12 7.5 Z" fill="#e23b3b"/>
  <path d="M12 7.5 C 12 5.5, 12.8 4.2, 14 4" fill="none" stroke="#6b4f2a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M13 6 q 3 -3 6 -1 q -2 3 -6 1 z" fill="#46a84a"/>
  <ellipse cx="9" cy="11.5" rx="1.4" ry="2.2" fill="#ff7a7a" opacity="0.7"/>
`);

const ORANGE = toDataUrl(`
  <path d="M11 5.5 q 2.5 -2 4.5 -0.8 q -1.2 2.4 -4.5 0.8 z" fill="#46a84a"/>
  <circle cx="12" cy="13.5" r="7" fill="#f08a24"/>
  <circle cx="12" cy="6.8" r="1" fill="#7a4a1a"/>
  <circle cx="9.6" cy="11" r="1.6" fill="#ffb066" opacity="0.85"/>
`);

const WATERMELON = toDataUrl(`
  <path d="M3 9 A 9 9 0 0 0 21 9 Z" fill="#3aa356"/>
  <path d="M5 9 A 7 7 0 0 0 19 9 Z" fill="#eaf7ea"/>
  <path d="M6.5 9 A 5.5 5.5 0 0 0 17.5 9 Z" fill="#e23b3b"/>
  <circle cx="9" cy="11" r="0.8" fill="#2b2b2b"/>
  <circle cx="12" cy="12.6" r="0.8" fill="#2b2b2b"/>
  <circle cx="15" cy="11" r="0.8" fill="#2b2b2b"/>
`);

const GOLDEN = toDataUrl(`
  <path d="M12 2.5 l2.6 6.1 6.6 .5 -5 4.3 1.6 6.4 -5.8 -3.5 -5.8 3.5 1.6 -6.4 -5 -4.3 6.6 -.5 z" fill="#ffd24a" stroke="#e0a93f" stroke-width="0.8" stroke-linejoin="round"/>
  <circle cx="12" cy="11" r="1.6" fill="#fff2b0" opacity="0.85"/>
`);

const SPRITE_SRC: Record<SpriteKey, string> = {
  [FruitType.CHERRY]: CHERRY,
  [FruitType.APPLE]: APPLE,
  [FruitType.ORANGE]: ORANGE,
  [FruitType.WATERMELON]: WATERMELON,
  GOLDEN,
};

let cache: Map<SpriteKey, HTMLImageElement> | null = null;

/**
 * Return the cached fruit sprite images, creating them on first call (browser
 * only). `onLoad` fires as each image finishes decoding, so the canvas can
 * redraw once the art is ready.
 */
export function getFruitSprites(onLoad: () => void): Map<SpriteKey, HTMLImageElement> {
  if (cache) return cache;
  cache = new Map();
  if (typeof Image === 'undefined') return cache;
  for (const key of Object.keys(SPRITE_SRC) as SpriteKey[]) {
    const img = new Image();
    img.onload = onLoad;
    img.src = SPRITE_SRC[key];
    cache.set(key, img);
  }
  return cache;
}
