import { useTranslation } from 'react-i18next';
import { GameStatus } from '../lib/constants';
import type { GameStatus as GameStatusValue } from '../lib/constants';
import type { MissionResultData } from '../lib/state/useRover';
import { formatTime } from './format';

interface Props {
  status: GameStatusValue;
  result: MissionResultData | null;
  isLastLevel: boolean;
  onRestart: () => void;
  onContinue: () => void;
  onExit: () => void;
}

export default function MissionResult({
  status,
  result,
  isLastLevel,
  onRestart,
  onContinue,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const escaped = status === GameStatus.ESCAPED;

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="panel">
        <h2 className="panel__title">{escaped ? t('mission.escaped') : t('mission.failed')}</h2>

        {escaped && result && (
          <div className="panel__stats">
            <p>{t('mission.time', { time: formatTime(result.timeMs) })}</p>
            <p>{t('mission.bestTime', { time: formatTime(result.bestTimeMs) })}</p>
            {result.isNewBest && <p className="panel__badge">{t('mission.newBest')}</p>}
          </div>
        )}

        {escaped && isLastLevel && (
          <p className="panel__congrats">{t('levelSelect.congratulations')}</p>
        )}

        <div className="panel__actions">
          {escaped ? (
            <button type="button" className="button button--primary" onClick={onContinue}>
              {t('pause.continue')}
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={onRestart}>
              {t('mission.restart')}
            </button>
          )}
          <button type="button" className="button" onClick={onExit}>
            {t('mission.exitLevels')}
          </button>
        </div>
      </div>
    </div>
  );
}
