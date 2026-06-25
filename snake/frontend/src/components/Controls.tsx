import { useTranslation } from 'react-i18next';
import { GameStatus } from '../lib/constants';
import type { GameStatus as GameStatusValue } from '../lib/constants';

interface ControlsProps {
  status: GameStatusValue;
  boosted: boolean;
  onStart: () => void;
  onNewGame: () => void;
  onTogglePause: () => void;
  onToggleBoost: () => void;
}

export function Controls({
  status,
  boosted,
  onStart,
  onNewGame,
  onTogglePause,
  onToggleBoost,
}: ControlsProps) {
  const { t } = useTranslation();
  const isPlaying = status === GameStatus.PLAYING;
  const isPaused = status === GameStatus.PAUSED;
  const inPlay = isPlaying || isPaused;

  return (
    <div className="controls">
      {status === GameStatus.IDLE && (
        <button type="button" className="button button--primary" onClick={onStart}>
          {t('game.start')}
        </button>
      )}

      {status === GameStatus.PAUSED && (
        <button type="button" className="button button--primary" onClick={onNewGame}>
          {t('game.restart')}
        </button>
      )}

      {status === GameStatus.GAME_OVER && (
        <button type="button" className="button button--primary" onClick={onNewGame}>
          {t('game.newGame')}
        </button>
      )}

      {inPlay && (
        <button type="button" className="button" onClick={onTogglePause}>
          {isPaused ? t('game.resume') : t('game.pause')}
        </button>
      )}

      <button
        type="button"
        className={`button${boosted ? ' is-active' : ''}`}
        onClick={onToggleBoost}
        aria-pressed={boosted}
        disabled={!isPlaying}
      >
        {t('game.boost')}
      </button>
    </div>
  );
}
