import { useTranslation } from 'react-i18next';
import { PropulsorMode } from '../lib/constants';
import type { GameState } from '../lib/constants';
import type { LevelConfig } from '../lib/levels';
import { formatTime } from './format';

interface Props {
  state: GameState;
  level: LevelConfig;
}

export default function HUD({ state, level }: Props) {
  const { t } = useTranslation();
  const collected = state.samples.filter((s) => s.collected).length;
  const isTurbine = state.rover.mode === PropulsorMode.TURBINE;

  return (
    <aside className="hud" aria-live="polite">
      <div className="hud__stat">
        <span className="hud__label">{isTurbine ? t('hud.electricity') : t('hud.fuel')}</span>
        <span className="hud__value">
          {Math.max(0, Math.round(isTurbine ? state.rover.electricity : state.rover.fuel))}
        </span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">{t('hud.time')}</span>
        <span className="hud__value">{formatTime(state.elapsedMs)}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">{t('hud.samples')}</span>
        <span className="hud__value">
          {collected} / {state.samples.length}
        </span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">{t('hud.gravity')}</span>
        <span className="hud__value">{t('planet.gravity', { value: level.gravity })}</span>
      </div>
      {level.tools.waterTurbines && (
        <div className="hud__stat hud__stat--tool">
          <span className="hud__label">{t('hud.mode')}</span>
          <span className="hud__value">
            {t(isTurbine ? 'hud.modeTurbine' : 'hud.modePropulsor')}
          </span>
        </div>
      )}
      {level.tools.laser && (
        <div className="hud__stat hud__stat--tool">
          <span className="hud__label">{t('hud.laser')}</span>
          <span className="hud__value">✓</span>
        </div>
      )}
      {state.allSamplesCollected && (
        <p className="hud__ready">{t('hud.missionReady')}</p>
      )}
    </aside>
  );
}
