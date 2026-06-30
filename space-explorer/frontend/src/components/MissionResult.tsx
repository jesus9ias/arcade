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
  const aborted = status === GameStatus.MISSION_ABORTED;

  const title = escaped
    ? t('mission.escaped')
    : aborted
      ? t('mission.aborted')
      : t('mission.failed');

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="panel">
        <h2 className="panel__title">{title}</h2>

        {aborted && <p className="panel__hint">{t('mission.abortedHint')}</p>}

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
            <button type="button" className="button button--primary" onClick={onContinue} autoFocus>
              {t('pause.continue')}
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={onRestart} autoFocus>
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
