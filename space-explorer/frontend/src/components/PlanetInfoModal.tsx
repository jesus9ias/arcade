import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { LevelConfig } from '../lib/levels';
import { WORLD_TYPE_ICON } from '../lib/constants';

interface Props {
  level: LevelConfig;
  onClose: () => void;
}

/**
 * Planet dossier — a read-only modal describing a planet (locked or not). Shows
 * the world-type icon, designation, name, distance, mass and gravity, then three
 * prose "unique characteristics" paragraphs. All copy follows the active language
 * (keys in en.json / es.json). Closes on the button or Escape.
 */
export default function PlanetInfoModal({ level, onClose }: Props) {
  const { t } = useTranslation();
  const slug = level.name.toLowerCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay overlay--fixed" role="dialog" aria-modal="true" aria-label={level.name}>
      <div className="panel panel--info">
        <p className="planet-info__eyebrow">{t('planet.info.title')}</p>
        <div className="planet-info__header">
          <span className="planet-info__icon" aria-hidden="true">
            {WORLD_TYPE_ICON[level.worldType]}
          </span>
          <span className="planet-info__heading">
            <span className="planet-info__designation">{level.designation}</span>
            <span className="planet-info__name">{level.name}</span>
          </span>
        </div>

        <dl className="planet-info__stats">
          <div className="planet-info__row">
            <dt>{t('planet.info.distance')}</dt>
            <dd>{level.distanceFromEarth}</dd>
          </div>
          <div className="planet-info__row">
            <dt>{t('planet.info.mass')}</dt>
            <dd>{t('planet.info.massValue', { value: level.massEarths })}</dd>
          </div>
          <div className="planet-info__row">
            <dt>{t('planet.info.gravity')}</dt>
            <dd>{t('planet.info.gravityValue', { value: level.gravity })}</dd>
          </div>
        </dl>

        <h3 className="planet-info__subtitle">{t('planet.info.characteristics')}</h3>
        <div className="planet-info__prose">
          <p>{t(`planet.info.${slug}.p1`)}</p>
          <p>{t(`planet.info.${slug}.p2`)}</p>
          <p>{t(`planet.info.${slug}.p3`)}</p>
        </div>

        <div className="panel__actions">
          <button type="button" className="button button--primary" onClick={onClose} autoFocus>
            {t('planet.info.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
