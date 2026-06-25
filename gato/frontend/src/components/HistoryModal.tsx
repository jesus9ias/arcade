import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DRAW, HISTORY_PAGE_SIZE } from '../lib/constants';
import { buildLeaderboard } from '../lib/history/history';
import type { MatchRecord } from '../lib/history/history';
import { Modal } from './Modal';

interface HistoryModalProps {
  records: MatchRecord[];
  onClose: () => void;
  onClear: () => void;
}

type Tab = 'list' | 'leaderboard';

export function HistoryModal({ records, onClose, onClear }: HistoryModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('list');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const recent = [...records].reverse();
  const leaderboard = buildLeaderboard(records);

  const rowCount = tab === 'list' ? recent.length : leaderboard.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const end = start + HISTORY_PAGE_SIZE;
  const pageRecent = recent.slice(start, end);
  const pageLeaderboard = leaderboard.slice(start, end);

  const selectTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  const resultLabel = (record: MatchRecord): string =>
    record.winner === DRAW ? t('history.draw') : record.winnerName;

  return (
    <Modal title={t('history.title')} onClose={onClose} className="modal--wide">
      <div className="history__tabs">
        <button
          type="button"
          className={`tab${tab === 'list' ? ' is-active' : ''}`}
          onClick={() => selectTab('list')}
        >
          {t('history.tabList')}
        </button>
        <button
          type="button"
          className={`tab${tab === 'leaderboard' ? ' is-active' : ''}`}
          onClick={() => selectTab('leaderboard')}
        >
          {t('history.tabLeaderboard')}
        </button>
      </div>

      {records.length === 0 ? (
        <p className="history__empty">{t('history.empty')}</p>
      ) : tab === 'list' ? (
        <div className="history__table-wrap">
        <table className="history__table">
          <thead>
            <tr>
              <th>{t('history.colDate')}</th>
              <th>{t('history.colPlayers')}</th>
              <th>{t('history.colResult')}</th>
              <th>{t('history.colTurns')}</th>
            </tr>
          </thead>
          <tbody>
            {pageRecent.map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString()}</td>
                <td>{`${record.playerOne} · ${record.playerTwo}`}</td>
                <td>{resultLabel(record)}</td>
                <td>{record.turns}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : (
        <div className="history__table-wrap">
        <table className="history__table">
          <thead>
            <tr>
              <th>{t('history.colPlayers')}</th>
              <th>{t('history.colWins')}</th>
              <th>{t('history.colGames')}</th>
              <th>{t('history.colWinRate')}</th>
              <th>{t('history.colAvgTurns')}</th>
            </tr>
          </thead>
          <tbody>
            {pageLeaderboard.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.wins}</td>
                <td>{row.games}</td>
                <td>{`${row.winRate}%`}</td>
                <td>{row.avgTurns}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {records.length > 0 && totalPages > 1 && (
        <div className="history__pagination">
          <button
            type="button"
            className="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t('history.prevPage')}
          </button>
          <span className="history__page-status">
            {t('history.pageStatus', { current: currentPage, total: totalPages })}
          </span>
          <button
            type="button"
            className="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('history.nextPage')}
          </button>
        </div>
      )}

      {records.length > 0 &&
        (confirming ? (
          <div className="history__confirm">
            <p>{t('history.clearConfirm')}</p>
            <div className="history__confirm-actions">
              <button
                type="button"
                className="button"
                onClick={() => setConfirming(false)}
              >
                {t('editPlayers.cancel')}
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  onClear();
                  setConfirming(false);
                }}
              >
                {t('history.clear')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button button--danger history__clear"
            onClick={() => setConfirming(true)}
          >
            {t('history.clear')}
          </button>
        ))}
    </Modal>
  );
}
