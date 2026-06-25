import { useTranslation } from 'react-i18next';
import { GameMode, SELECTABLE_MODES } from '../lib/constants';
import type { GameMode as GameModeValue } from '../lib/constants';

interface ModeSelectorProps {
  mode: GameModeValue;
  disabled: boolean;
  onChange: (mode: GameModeValue) => void;
}

const MODE_LABEL: Record<string, string> = {
  [GameMode.SIMPLE]: 'mode.simple',
  [GameMode.VERSUS]: 'mode.versus',
};

export function ModeSelector({ mode, disabled, onChange }: ModeSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="mode-selector" role="group" aria-label={t('mode.label')}>
      {SELECTABLE_MODES.map((value) => (
        <button
          key={value}
          type="button"
          className={`mode-selector__option${value === mode ? ' is-active' : ''}`}
          aria-pressed={value === mode}
          disabled={disabled}
          onClick={() => onChange(value)}
        >
          {t(MODE_LABEL[value])}
        </button>
      ))}
    </div>
  );
}
