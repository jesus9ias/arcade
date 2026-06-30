// Planet world types. Each level declares one; the level-select icon is derived
// from it (see WORLD_TYPE_ICON in ui.ts). Extend this catalog — and its icon
// map — when a new planet archetype is introduced for a future level.

export const WorldType = {
  VERDANT: 'VERDANT', // lush, vegetated worlds
  VOLCANIC: 'VOLCANIC', // molten, iron-rich, scorched worlds
  FROZEN: 'FROZEN', // icy worlds with frozen lakes
} as const;
export type WorldType = (typeof WorldType)[keyof typeof WorldType];
