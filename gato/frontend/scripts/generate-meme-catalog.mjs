/**
 * Generates src/lib/memes/catalog.json by scanning public/memes/{win,lose,neutral}/.
 *
 * Run with `npm run gen:memes` whenever meme image files are added or removed.
 * The catalog is the manifest the app imports at runtime; the browser cannot
 * scan the filesystem, so this build-time script keeps the manifest in sync.
 *
 * Image binaries are developer-provided and never committed by Claude Code; this
 * script only records the filenames it finds.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, '..');

/** Category folder names — must mirror MEME_CATEGORY in src/lib/constants/game.ts. */
const CATEGORIES = ['win', 'lose', 'neutral'];
const MEMES_DIR = join(FRONTEND_ROOT, 'public', 'memes');
const OUTPUT_FILE = join(FRONTEND_ROOT, 'src', 'lib', 'memes', 'catalog.json');

/** Image extensions counted as memes; anything else (e.g. .gitkeep) is ignored. */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'];

const isImage = (name) =>
  IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

async function listImages(category) {
  const dir = join(MEMES_DIR, category);
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && isImage(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function main() {
  const catalog = {};
  for (const category of CATEGORIES) {
    catalog[category] = await listImages(category);
  }

  await writeFile(OUTPUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  const total = CATEGORIES.reduce((sum, c) => sum + catalog[c].length, 0);
  console.log(`Wrote ${OUTPUT_FILE}`);
  for (const category of CATEGORIES) {
    console.log(`  ${category}: ${catalog[category].length}`);
  }
  console.log(`Total: ${total} meme(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
