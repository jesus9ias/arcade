import type { MemeCatalog } from '../memes/memes';

/** Base public path for meme images: `public/memes/<category>/<filename>`. */
export const MEME_BASE_PATH = '/memes';

/**
 * Catalog of meme filenames per category. Populated by the developer with files
 * placed under `public/memes/{win,lose,neutral}/`. Claude Code creates the
 * structure and loader only; images and this manifest's entries are added by the
 * developer.
 */
export const MEME_CATALOG: MemeCatalog = {
  win: [],
  lose: [],
  neutral: [],
};
