import { useTranslation } from 'react-i18next';
import { MAX_LEVEL, MIN_LEVEL } from '../lib/constants/levels';

interface Props {
  startLevel: number;
  onSetStartLevel: (n: number) => void;
  onPlay: () => void;
  onOpenScoreboard: () => void;
  onOpenControls: () => void;
}

export function StartScreen({
  startLevel,
  onSetStartLevel,
  onPlay,
  onOpenScoreboard,
  onOpenControls,
}: Props) {
  const { t } = useTranslation();
  const levels = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i);
  return (
    <div className="center-screen">
      <div className="card">
        <h1>{t('start.title').toUpperCase()}</h1>
        <p className="subtitle">{t('start.subtitle')}</p>
        <div className="field">
          <label>{t('start.startLevel')}</label>
          <div className="level-picker">
            {levels.map((lvl) => (
              <button
                type="button"
                key={lvl}
                className="level-chip"
                aria-pressed={lvl === startLevel}
                onClick={() => onSetStartLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn" onClick={onPlay}>
          {t('start.play').toUpperCase()}
        </button>
        <div className="row-actions">
          <button type="button" className="btn btn--muted" onClick={onOpenScoreboard}>
            {t('start.scoreboard').toUpperCase()}
          </button>
          <button type="button" className="btn btn--muted" onClick={onOpenControls}>
            {t('start.controls').toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
