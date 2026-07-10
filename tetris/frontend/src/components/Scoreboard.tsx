import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDuration, formatScore } from './format';
import { HISTORY_PAGE_SIZE } from '../lib/constants/storage';
import type { Scores } from '../lib/history/records';

interface Props {
  scores: Scores;
  language: string;
  onClear: () => void;
  onBack: () => void;
}

export function Scoreboard({ scores, language, onClear, onBack }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const pageCount = Math.max(1, Math.ceil(scores.records.length / HISTORY_PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = scores.records.slice(
    current * HISTORY_PAGE_SIZE,
    current * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
  );

  return (
    <div className="center-screen">
      <div className="card" style={{ width: 'min(720px, 96vw)' }}>
        <h2 style={{ margin: 0, letterSpacing: '3px', color: 'var(--cyan)' }}>
          {t('scoreboard.title')}
        </h2>

        {scores.best && (
          <div className="best-banner">
            <span>{t('scoreboard.best')}</span>
            <span>{formatScore(scores.best.score, language)}</span>
          </div>
        )}

        {scores.records.length === 0 ? (
          <p className="subtitle">{t('scoreboard.empty')}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="scores">
                <thead>
                  <tr>
                    <th>{t('scoreboard.date')}</th>
                    <th>{t('scoreboard.score')}</th>
                    <th>{t('scoreboard.regular')}</th>
                    <th>{t('scoreboard.bonus')}</th>
                    <th>{t('scoreboard.lines')}</th>
                    <th>{t('scoreboard.startLevel')}</th>
                    <th>{t('scoreboard.endLevel')}</th>
                    <th>{t('scoreboard.duration')}</th>
                    <th>{t('scoreboard.result')}</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date, language)}</td>
                      <td>{formatScore(r.score, language)}</td>
                      <td>{formatScore(r.regularPoints, language)}</td>
                      <td>{formatScore(r.bonusPoints, language)}</td>
                      <td>{r.linesCleared}</td>
                      <td>{r.startLevel}</td>
                      <td>{r.endLevel}</td>
                      <td>{formatDuration(r.durationMs)}</td>
                      <td>{t(r.outcome === 'VICTORY' ? 'outcome.victory' : 'outcome.gameOver')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="pager">
                <button
                  type="button"
                  className="toggle"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  {t('scoreboard.prev')}
                </button>
                <span>
                  {current + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  className="toggle"
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                >
                  {t('scoreboard.next')}
                </button>
              </div>
            )}
          </>
        )}

        <div className="row-actions">
          <button type="button" className="btn btn--muted" onClick={onBack}>
            {t('scoreboard.back').toUpperCase()}
          </button>
          {scores.records.length > 0 && (
            <button type="button" className="btn btn--pink" onClick={() => setConfirming(true)}>
              {t('scoreboard.clear').toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <p className="subtitle">{t('scoreboard.clearConfirm')}</p>
            <div className="row-actions">
              <button
                type="button"
                className="btn btn--pink"
                onClick={() => {
                  onClear();
                  setConfirming(false);
                  setPage(0);
                }}
              >
                {t('scoreboard.confirm').toUpperCase()}
              </button>
              <button type="button" className="btn btn--muted" onClick={() => setConfirming(false)}>
                {t('scoreboard.cancel').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
