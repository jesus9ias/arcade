import { useTranslation } from 'react-i18next';
import type { TetrisController } from '../lib/state/useTetris';

// Bottom control bar for touch devices. Icons are literal glyphs; word labels
// come from i18n. A counter-clockwise rotate button is added (design has one).
export function TouchControls({ controller }: { controller: TetrisController }) {
  const { t } = useTranslation();
  return (
    <nav className="touchbar" aria-label={t('controls.title')}>
      <button
        type="button"
        className="round-btn"
        aria-label={t('controls.moveLeft')}
        onClick={controller.moveLeft}
      >
        ◀
      </button>
      <button
        type="button"
        className="round-btn round-btn--magenta"
        aria-label={t('controls.rotateCcw')}
        onClick={controller.rotateCcw}
      >
        ⟲
      </button>
      <button
        type="button"
        className="round-btn round-btn--magenta"
        aria-label={t('controls.rotateCw')}
        onClick={controller.rotateCw}
      >
        ⟳
      </button>
      <button
        type="button"
        className="round-btn"
        aria-label={t('controls.moveRight')}
        onClick={controller.moveRight}
      >
        ▶
      </button>
      <button
        type="button"
        className="round-btn round-btn--yellow"
        aria-label={t('controls.softDrop')}
        onPointerDown={controller.softDropStart}
        onPointerUp={controller.softDropEnd}
        onPointerLeave={controller.softDropEnd}
      >
        ▼
      </button>
      <button
        type="button"
        className="pill-btn"
        aria-label={t('controls.hold')}
        onClick={controller.hold}
      >
        {t('controls.hold').toUpperCase()}
      </button>
      <button
        type="button"
        className="pill-btn"
        aria-label={t('controls.hardDrop')}
        onClick={controller.hardDrop}
      >
        ⤓
      </button>
    </nav>
  );
}
