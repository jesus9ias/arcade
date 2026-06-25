import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DRAW } from '../lib/constants';
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
  const [confirming, setConfirming] = useState(false);

  const recent = [...records].reverse();
  const leaderboard = buildLeaderboard(records);

  const resultLabel = (record: MatchRecord): string =>
    record.winner === DRAW ? t('history.draw') : record.winnerName;

  return (
    <Modal title={t('history.title')} onClose={onClose} className="modal--wide">
      <div className="history__tabs">
        <button
          type="button"
          className={`tab${tab === 'list' ? ' is-active' : ''}`}
          onClick={() => setTab('list')}
        >
          {t('history.tabList')}
        </button>
        <button
          type="button"
          className={`tab${tab === 'leaderboard' ? ' is-active' : ''}`}
          onClick={() => setTab('leaderboard')}
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
            {recent.map((record) => (
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
            {leaderboard.map((row) => (
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
            className="button button--danger"
            onClick={() => setConfirming(true)}
          >
            {t('history.clear')}
          </button>
        ))}
    </Modal>
  );
}
