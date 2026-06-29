import { useTranslation } from 'react-i18next';
import { LEVELS, lastLevelId } from '../lib/levels';
import type { LevelConfig } from '../lib/levels';
import { isLevelUnlocked, type LevelProgress } from '../lib/progress/progress';
import { formatTime } from './format';

interface Props {
  progress: LevelProgress[];
  onSelect: (level: LevelConfig) => void;
}

export default function LevelSelectScreen({ progress, onSelect }: Props) {
  const { t } = useTranslation();
  const lastId = lastLevelId();
  const allDone = progress.find((r) => r.levelId === lastId)?.completed ?? false;

  return (
    <section className="level-select">
      <h2 className="level-select__title">{t('levelSelect.title')}</h2>

      {allDone && (
        <p className="level-select__congrats">{t('levelSelect.congratulations')}</p>
      )}

      <ul className="level-grid">
        {LEVELS.map((level) => {
          const record = progress.find((r) => r.levelId === level.id);
          const unlocked = isLevelUnlocked(progress, level.id);
          const best = record?.bestTimeMs ?? null;
          return (
            <li key={level.id}>
              <button
                type="button"
                className="level-card"
                disabled={!unlocked}
                aria-disabled={!unlocked}
                onClick={() => unlocked && onSelect(level)}
              >
                <span className="level-card__name">{level.name}</span>
                <span className="level-card__meta">
                  {t('planet.distance', { value: level.distanceFromEarth })}
                </span>
                <span className="level-card__meta">
                  {t('planet.gravity', { value: level.gravity })}
                </span>
                <span className="level-card__best">
                  {unlocked
                    ? best === null
                      ? t('levelSelect.bestTime', { time: t('levelSelect.noTime') })
                      : t('levelSelect.bestTime', { time: formatTime(best) })
                    : t('levelSelect.locked')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
