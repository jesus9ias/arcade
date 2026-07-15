// Sound system with a mute toggle. Audio files are placeholders for now (added
// under public/audio/ in Stage 5); missing files and rejected play() calls are
// swallowed so the game never breaks when assets are absent.

export type SoundEvent =
  | 'move'
  | 'rotate'
  | 'softDrop'
  | 'hardDrop'
  | 'lock'
  | 'lineClear'
  | 'tetris'
  | 'tspin'
  | 'levelUp'
  | 'hold'
  | 'bonus'
  | 'gameOver'
  | 'pause'
  | 'modalOpen';

// Event → file under /audio (placeholder paths; files added later).
const SOUND_SRC: Record<SoundEvent, string> = {
  move: '/audio/move.mp3',
  rotate: '/audio/rotate.mp3',
  softDrop: '/audio/soft-drop.mp3',
  hardDrop: '/audio/hard-drop.mp3',
  lock: '/audio/lock.mp3',
  lineClear: '/audio/line-clear.mp3',
  tetris: '/audio/tetris.mp3',
  tspin: '/audio/tspin.mp3',
  levelUp: '/audio/level-up.mp3',
  hold: '/audio/hold.mp3',
  bonus: '/audio/bonus.mp3',
  gameOver: '/audio/game-over.mp3',
  pause: '/audio/pause.mp3',
  modalOpen: '/audio/modal-open.mp3',
};

const MUSIC_SRC = '/audio/music.mp3';

export class AudioManager {
  private muted = false;
  private readonly cache = new Map<SoundEvent, HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;

  constructor(muted = false) {
    this.muted = muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.music) this.music.muted = muted;
    for (const el of this.cache.values()) el.muted = muted;
  }

  play(event: SoundEvent): void {
    if (this.muted || typeof Audio === 'undefined') return;
    try {
      let el = this.cache.get(event);
      if (!el) {
        el = new Audio(SOUND_SRC[event]);
        this.cache.set(event, el);
      }
      el.currentTime = 0;
      void el.play().catch(() => {});
    } catch {
      /* asset missing — ignore */
    }
  }

  // Background music, started by a user gesture to satisfy autoplay policy.
  startMusic(): void {
    if (typeof Audio === 'undefined') return;
    try {
      if (!this.music) {
        this.music = new Audio(MUSIC_SRC);
        this.music.loop = true;
        this.music.volume = 0.5;
      }
      this.music.muted = this.muted;
      void this.music.play().catch(() => {});
    } catch {
      /* asset missing — ignore */
    }
  }

  stopMusic(): void {
    this.music?.pause();
  }

  // Stops any SFX still playing (e.g. a long gameOver clip) so it can't
  // bleed into the next screen or overlap the next run's music.
  stopAllSfx(): void {
    for (const el of this.cache.values()) {
      el.pause();
      el.currentTime = 0;
    }
  }
}
