// Presentation helper: format an elapsed duration in ms as m:ss.s.

export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

/** Display id for a level, zero-padded to three digits: 1 → "#001". */
export function formatLevelId(id: number): string {
  return `#${id.toString().padStart(3, '0')}`;
}
