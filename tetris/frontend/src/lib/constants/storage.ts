// localStorage keys and history bounds.

export const STORAGE_KEYS = {
  prefs: 'tetris_prefs',
  scores: 'tetris_scores',
} as const;

export const HISTORY_LIMIT = 50; // most recent runs kept (best is pinned separately)
export const HISTORY_PAGE_SIZE = 10;
