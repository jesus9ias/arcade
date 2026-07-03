import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LEVELS, lastLevelId } from '../lib/levels';
import type { LevelConfig } from '../lib/levels';
import { WORLD_TYPE_ICON } from '../lib/constants';
import { isLevelUnlocked, type LevelProgress } from '../lib/progress/progress';
import { formatTime } from './format';
import PlanetInfoModal from './PlanetInfoModal';

interface Props {
  progress: LevelProgress[];
  onSelect: (level: LevelConfig) => void;
}

export default function LevelSelectScreen({ progress, onSelect }: Props) {
  const { t } = useTranslation();
  const lastId = lastLevelId();
  const allDone = progress.find((r) => r.levelId === lastId)?.completed ?? false;
  const [infoLevel, setInfoLevel] = useState<LevelConfig | null>(null);

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
              <div className={`level-card${unlocked ? '' : ' level-card--locked'}`}>
                <span className="level-card__name">
                  <span className="level-card__icon" aria-hidden="true">
                    {WORLD_TYPE_ICON[level.worldType]}
                  </span>
                  <span className="level-card__id">{level.designation}</span>
                  <span className="level-card__title">{level.name}</span>
                </span>
                <span className="level-card__meta">
                  {t('planet.distance', { value: level.distanceFromEarth })}
                </span>
                <span className="level-card__meta">
                  {t('planet.gravity', { value: level.gravity })}
                </span>
                <span className="level-card__footer">
                  {unlocked ? (
                    <span className="level-card__best">
                      {best === null
                        ? t('levelSelect.bestTime', { time: t('levelSelect.noTime') })
                        : t('levelSelect.bestTime', { time: formatTime(best) })}
                    </span>
                  ) : (
                    <span
                      className="level-card__lock"
                      role="img"
                      aria-label={t('levelSelect.locked')}
                      title={t('levelSelect.locked')}
                    >
                      🔒
                    </span>
                  )}

                  <span className="level-card__actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setInfoLevel(level)}
                      aria-label={t('levelSelect.info')}
                      title={t('levelSelect.info')}
                    >
                      ℹ️
                    </button>
                    {unlocked && (
                      <button
                        type="button"
                        className="icon-button icon-button--play"
                        onClick={() => onSelect(level)}
                        aria-label={t('levelSelect.play')}
                        title={t('levelSelect.play')}
                      >
                        ▶
                      </button>
                    )}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {infoLevel && <PlanetInfoModal level={infoLevel} onClose={() => setInfoLevel(null)} />}
    </section>
  );
}
