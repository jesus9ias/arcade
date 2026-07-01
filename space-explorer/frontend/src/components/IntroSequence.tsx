import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  INTRO_PARAGRAPH_COUNT,
  INTRO_PARAGRAPH_DURATION_MS,
  INTRO_EXIT_DURATION_MS,
  INTRO_AUDIO_SRC,
  INTRO_AUDIO_VOLUME,
} from '../lib/constants';
import IntroScene from './IntroScene';

// Entrance styles cycled per paragraph (maps to `.intro__paragraph--<dir>` in CSS).
// `from-center` zooms in from the middle instead of sliding from an edge.
const ENTER_DIRECTIONS = [
  'from-bottom',
  'from-right',
  'from-center',
  'from-top',
  'from-left',
] as const;

interface Props {
  /** Called when the player starts the story (persists the seen flag). */
  onStart: () => void;
  /** Called when the story ends — finished or skipped — to reveal the game. */
  onClose: () => void;
}

/**
 * First-visit story overlay. Shows a start screen with a Begin button (the
 * gesture that will unlock audio in Phase 3), then auto-advances through the
 * story paragraphs. A corner Skip button dismisses it at any point.
 */
export default function IntroSequence({ onStart, onClose }: Props) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  // While exiting, the last paragraph fades out and the whole overlay dissolves
  // (CSS `.intro--exiting`) before onClose unmounts it, revealing the level select.
  const [exiting, setExiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beginRef = useRef<HTMLButtonElement | null>(null);

  // Focus the Begin button on the start screen so Enter/Space starts the intro.
  // (More reliable than `autoFocus` for this client-only, conditionally-mounted
  // overlay, whose focus can be lost during hydration.)
  useEffect(() => {
    if (!started) beginRef.current?.focus();
  }, [started]);

  // Auto-advance one paragraph at a time; after the last one, start the exit.
  useEffect(() => {
    if (!started || exiting) return;
    const isLast = index >= INTRO_PARAGRAPH_COUNT - 1;
    const id = window.setTimeout(() => {
      if (isLast) setExiting(true);
      else setIndex((i) => i + 1);
    }, INTRO_PARAGRAPH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [started, index, exiting]);

  // Once the exit transition begins, fade the music out and unmount when done.
  useEffect(() => {
    if (!exiting) return;
    const audio = audioRef.current;
    let fade: number | undefined;
    if (audio && !audio.paused) {
      const steps = 20;
      const startVol = audio.volume;
      let n = 0;
      fade = window.setInterval(() => {
        n += 1;
        audio.volume = Math.max(0, startVol * (1 - n / steps));
        if (n >= steps) window.clearInterval(fade);
      }, INTRO_EXIT_DURATION_MS / steps);
    }
    const id = window.setTimeout(onClose, INTRO_EXIT_DURATION_MS);
    return () => {
      window.clearTimeout(id);
      if (fade) window.clearInterval(fade);
    };
  }, [exiting, onClose]);

  // Stop the music if the intro is torn down for any reason.
  useEffect(() => () => audioRef.current?.pause(), []);

  const handleStart = () => {
    onStart();
    setStarted(true);
    // Begin is the user gesture that unlocks audio; start the music now.
    const audio = audioRef.current;
    if (audio) {
      audio.volume = INTRO_AUDIO_VOLUME;
      audio.muted = muted;
      // Missing file / autoplay rejection is non-fatal — the intro plays on.
      void audio.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  // Vary each paragraph's entrance edge so the story doesn't always slide in
  // from the bottom; cycled deterministically by paragraph index.
  const enterDirection = ENTER_DIRECTIONS[index % ENTER_DIRECTIONS.length];

  return (
    <div
      className={exiting ? 'intro intro--exiting' : 'intro'}
      role="dialog"
      aria-modal="true"
      aria-label={t('intro.title')}
    >
      <IntroScene started={started} index={index} />
      <audio ref={audioRef} src={INTRO_AUDIO_SRC} loop preload="none" />

      {started && (
        <button
          type="button"
          className="intro__mute"
          onClick={toggleMute}
          aria-label={muted ? t('intro.unmute') : t('intro.mute')}
          title={muted ? t('intro.unmute') : t('intro.mute')}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      <button
        type="button"
        className="intro__skip"
        onClick={() => setExiting(true)}
        aria-label={t('intro.skip')}
      >
        {t('intro.skip')} ✕
      </button>

      {!started ? (
        <div className="intro__start">
          <h2 className="intro__title">{t('intro.title')}</h2>
          <button
            ref={beginRef}
            type="button"
            className="button button--primary intro__begin"
            onClick={handleStart}
          >
            ▶ {t('intro.start')}
          </button>
        </div>
      ) : (
        <div className="intro__stage">
          {/* key restarts the entrance animation each time the paragraph changes */}
          <p key={index} className={`intro__paragraph intro__paragraph--${enterDirection}`}>
            {t(`intro.p${index + 1}`)}
          </p>
        </div>
      )}
    </div>
  );
}
