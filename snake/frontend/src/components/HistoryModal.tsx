import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameMode, HISTORY_PAGE_SIZE } from '../lib/constants';
import { groupByMode } from '../lib/history/history';
import type { GameRecord } from '../lib/history/history';
import { Modal } from './Modal';

interface HistoryModalProps {
  records: GameRecord[];
  onClose: () => void;
  onClear: () => void;
}

// Only the two implemented modes have a history tab.
type HistoryTab = typeof GameMode.SIMPLE | typeof GameMode.VERSUS;

export function HistoryModal({ records, onClose, onClear }: HistoryModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<HistoryTab>(GameMode.SIMPLE);
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const grouped = groupByMode(records);
  const rows = grouped[tab];
  const isVersus = tab === GameMode.VERSUS;

  const totalPages = Math.max(1, Math.ceil(rows.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const pageRows = rows.slice(start, start + HISTORY_PAGE_SIZE);

  const selectTab = (next: HistoryTab) => {
    setTab(next);
    setPage(1);
  };

  return (
    <Modal title={t('history.title')} onClose={onClose} className="modal--wide">
      <div className="history__tabs">
        <button
          type="button"
          className={`tab${tab === GameMode.SIMPLE ? ' is-active' : ''}`}
          onClick={() => selectTab(GameMode.SIMPLE)}
        >
          {t('history.tabSimple')}
        </button>
        <button
          type="button"
          className={`tab${tab === GameMode.VERSUS ? ' is-active' : ''}`}
          onClick={() => selectTab(GameMode.VERSUS)}
        >
          {t('history.tabVersus')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="history__empty">{t('history.empty')}</p>
      ) : (
        <div className="history__table-wrap">
          <table className="history__table">
            <thead>
              <tr>
                <th>{t('history.colDate')}</th>
                <th>{t('history.colLevel')}</th>
                <th>{isVersus ? t('history.colYou') : t('history.colScore')}</th>
                {isVersus && <th>{t('history.colMachine')}</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.date).toLocaleString()}</td>
                  <td>{record.level}</td>
                  <td>{record.playerScore}</td>
                  {isVersus && <td>{record.machineScore ?? 0}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
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
                {t('history.cancel')}
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
