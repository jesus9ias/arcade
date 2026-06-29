// Deterministic terrain authoring helpers. These compose a heightmap from
// readable flat/slope segments and expose each segment's start column so sample
// locations can be pinned to flat-zone centers. No randomness, no DOM.

export interface TerrainSegment {
  width: number;
  from: number;
  /** Omit for a flat segment (to === from). */
  to?: number;
}

/** Flattens segments into a per-column height array. */
export function composeHeightmap(segments: TerrainSegment[]): number[] {
  const out: number[] = [];
  for (const seg of segments) {
    const to = seg.to ?? seg.from;
    for (let i = 0; i < seg.width; i++) {
      const t = seg.width === 1 ? 0 : i / (seg.width - 1);
      out.push(Math.round(seg.from + (to - seg.from) * t));
    }
  }
  return out;
}

/** Start column index of each segment, in order. */
export function segmentStarts(segments: TerrainSegment[]): number[] {
  const starts: number[] = [];
  let acc = 0;
  for (const seg of segments) {
    starts.push(acc);
    acc += seg.width;
  }
  return starts;
}

/** Center column of the segment at `index` (used to place samples on flat zones). */
export function segmentCenter(segments: TerrainSegment[], index: number): number {
  const start = segmentStarts(segments)[index];
  return start + Math.floor(segments[index].width / 2);
}
