// Intro controller. Owns the `space_intro_seen` localStorage side effect (kept
// out of the pure layers, mirroring how useRover owns persistence) and exposes
// whether the story overlay should be shown. Per product decision, "seen" is
// persisted only when the player actually starts the intro (markSeen) — skipping
// does not mark it seen, and replay never clears it.

import { useCallback, useState } from 'react';
import { STORAGE_KEYS, INTRO_SEEN_VALUE } from '../lib/constants';

/** True once the player has started the intro at least once. Storage failures
 *  fall back to "not seen" so the story simply plays again next visit. */
function hasSeenIntro(): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEYS.INTRO_SEEN) === INTRO_SEEN_VALUE;
  } catch {
    return false;
  }
}

export interface UseIntro {
  /** Whether the intro overlay is currently active. */
  active: boolean;
  /** Persist that the intro has been started (called from the Begin button). */
  markSeen: () => void;
  /** Reopen the intro on demand (top-nav replay button). */
  replay: () => void;
  /** Close the intro without touching the stored flag. */
  close: () => void;
}

export function useIntro(): UseIntro {
  const [active, setActive] = useState<boolean>(() => !hasSeenIntro());

  const markSeen = useCallback(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, INTRO_SEEN_VALUE);
    } catch {
      /* storage unavailable — the intro will simply replay next visit */
    }
  }, []);

  const replay = useCallback(() => setActive(true), []);
  const close = useCallback(() => setActive(false), []);

  return { active, markSeen, replay, close };
}
