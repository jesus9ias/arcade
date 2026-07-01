// Story-intro constants. The intro is a first-visit UI overlay (not an FSM
// state); these literals drive its gating and pacing. Timings are intentionally
// tunable — adjust here, never inline in the component.

/** Sentinel written to `space_intro_seen` once the player starts the intro. */
export const INTRO_SEEN_VALUE = 'true';

/** Number of story paragraphs; matches the i18n keys `intro.p1` … `intro.pN`. */
export const INTRO_PARAGRAPH_COUNT = 6;

/** Number of decorative twinkling stars in the intro backdrop. */
export const INTRO_STAR_COUNT = 60;

/** How long each paragraph stays on screen before auto-advancing (ms). */
export const INTRO_PARAGRAPH_DURATION_MS = 9000;

/** Total exit transition before the intro unmounts (ms). Must cover the CSS
 *  two-stage exit: the last paragraph fades, then the whole overlay dissolves
 *  to reveal the level select underneath. Keep in sync with the `.intro--exiting`
 *  timings in global.css. */
export const INTRO_EXIT_DURATION_MS = 1200;

/** Background-music track for the intro, served from `public/audio/`. The audio
 *  file is added separately; until it exists, playback simply no-ops (the
 *  play() promise rejects and is swallowed), so the intro still works without it.
 *  Source: Pixabay — "Musical Atmo Sound" by Alien_I_Trust / Dimension X (id 240618),
 *  https://pixabay.com/es/sound-effects/musical-atmo-sound-by-alien-i-trust-dimension-x-240618/ */
export const INTRO_AUDIO_SRC = '/audio/intro.mp3';

/** Intro music volume when unmuted (0–1). */
export const INTRO_AUDIO_VOLUME = 0.5;

/** Cross-fade duration between intro scenes (ms). */
export const INTRO_SCENE_FADE_MS = 900;

/** Paragraph index used by the opening scene, shown before the story starts. */
export const INTRO_START_SCENE_PARAGRAPH = -1;

/**
 * Ordered scene timeline. `startParagraph` is the 0-based paragraph index at
 * which a scene begins (−1 = the start-screen scene). The active scene is the
 * last one whose `startParagraph` is ≤ the current paragraph, so scenes advance
 * automatically as the story does. Add/repartition scenes here — the manager and
 * the `IntroSceneKey` union follow this list.
 */
export const INTRO_SCENES = [
  { key: 'space', startParagraph: INTRO_START_SCENE_PARAGRAPH }, // start screen — cosmos
  { key: 'city', startParagraph: 0 }, // paragraphs 1–2 — energy-crisis city, dusk → night
  { key: 'departure', startParagraph: 2 }, // paragraphs 3–4 — leaving Earth
  { key: 'approach', startParagraph: 4 }, // paragraphs 5–6 — nearing a new world
] as const;

export type IntroSceneKey = (typeof INTRO_SCENES)[number]['key'];
