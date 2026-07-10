import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

export function ControlsModal({ onClose }: Props) {
  const { t } = useTranslation();
  const rows: Array<[string, string]> = [
    [t('controls.moveLeft'), '← / ◀'],
    [t('controls.moveRight'), '→ / ▶'],
    [t('controls.softDrop'), '↓ / ▼'],
    [t('controls.hardDrop'), 'Space / ⤓'],
    [t('controls.rotateCw'), '↑ · X / ⟳'],
    [t('controls.rotateCcw'), 'Z / ⟲'],
    [t('controls.hold'), 'C · Shift'],
    [t('controls.pause'), 'P · Esc'],
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0, letterSpacing: '3px', color: 'var(--cyan)' }}>
          {t('controls.title')}
        </h2>
        <div className="table-wrap">
          <table className="scores">
            <tbody>
              {rows.map(([action, keys]) => (
                <tr key={action}>
                  <td>{action}</td>
                  <td>{keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn" onClick={onClose}>
          {t('controls.close').toUpperCase()}
        </button>
      </div>
    </div>
  );
}
