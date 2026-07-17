import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatScore } from './format';

export function PauseOverlay({
  onResume,
  onExitToMenu,
}: {
  onResume: () => void;
  onExitToMenu: () => void;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="overlay overlay--pause">
      <div className="overlay-title overlay-title--cyan">{t('state.paused').toUpperCase()}</div>
      <button type="button" className="btn" onClick={onResume}>
        {t('state.resume').toUpperCase()}
      </button>
      <button type="button" className="btn btn--muted" onClick={() => setConfirming(true)}>
        {t('state.menu').toUpperCase()}
      </button>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <p className="subtitle">{t('state.exitConfirm')}</p>
            <div className="row-actions">
              <button type="button" className="btn btn--pink" onClick={onExitToMenu}>
                {t('state.exitConfirmYes').toUpperCase()}
              </button>
              <button type="button" className="btn btn--muted" onClick={() => setConfirming(false)}>
                {t('state.exitConfirmNo').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface EndProps {
  score: number;
  language: string;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverOverlay({ score, language, onRetry, onMenu }: EndProps) {
  const { t } = useTranslation();
  return (
    <div className="overlay overlay--over">
      <div className="overlay-title overlay-title--pink">{t('state.gameOver').toUpperCase()}</div>
      <div className="overlay-sub">{t('state.finalScore').toUpperCase()}</div>
      <div className="overlay-score">{formatScore(score, language)}</div>
      <div className="row-actions">
        <button type="button" className="btn btn--pink" onClick={onRetry}>
          {t('state.retry').toUpperCase()}
        </button>
        <button type="button" className="btn btn--muted" onClick={onMenu}>
          {t('state.menu').toUpperCase()}
        </button>
      </div>
    </div>
  );
}

export function VictoryOverlay({ score, language, onRetry, onMenu }: EndProps) {
  const { t } = useTranslation();
  return (
    <div className="overlay overlay--over">
      <div className="overlay-title overlay-title--yellow">{t('state.victory').toUpperCase()}</div>
      <div className="overlay-sub">{t('state.victoryBody')}</div>
      <div className="overlay-score">{formatScore(score, language)}</div>
      <div className="row-actions">
        <button type="button" className="btn" onClick={onRetry}>
          {t('state.retry').toUpperCase()}
        </button>
        <button type="button" className="btn btn--muted" onClick={onMenu}>
          {t('state.menu').toUpperCase()}
        </button>
      </div>
    </div>
  );
}
