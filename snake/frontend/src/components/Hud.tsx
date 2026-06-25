import { useTranslation } from 'react-i18next';
import { GameMode } from '../lib/constants';
import type { GameState } from '../lib/engine/engine';

interface HudProps {
  game: GameState;
}

export function Hud({ game }: HudProps) {
  const { t } = useTranslation();
  const isVersus = game.mode === GameMode.VERSUS;

  return (
    <div className="hud">
      <div className="hud__item">
        <span className="hud__label">{t('game.level')}</span>
        <span className="hud__value">{game.level}</span>
      </div>

      <div className="hud__item">
        <span className="hud__label">{isVersus ? t('players.you') : t('game.score')}</span>
        <span className="hud__value">{game.scores.player}</span>
      </div>

      {isVersus && (
        <div className="hud__item">
          <span className="hud__label">{t('players.machine')}</span>
          <span className="hud__value">{game.scores.machine}</span>
        </div>
      )}

      <div className="hud__item hud__item--progress">
        <span className="hud__label">{t('game.fruits')}</span>
        <span className="hud__value">
          {game.fruitsEatenThisLevel}/{game.fruitsRequiredThisLevel}
        </span>
      </div>

      {game.boosted && <span className="hud__badge">{t('game.boost')}</span>}
    </div>
  );
}
