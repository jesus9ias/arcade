import type { CellValue } from '../lib/constants';

interface CellProps {
  value: CellValue;
  index: number;
  highlighted: boolean;
  disabled: boolean;
  onPlay: (index: number) => void;
}

export function Cell({ value, index, highlighted, disabled, onPlay }: CellProps) {
  return (
    <button
      type="button"
      className={`cell${highlighted ? ' cell--win' : ''}${value ? ` cell--${value.toLowerCase()}` : ''}`}
      onClick={() => onPlay(index)}
      disabled={disabled || value !== null}
    >
      {value ?? ''}
    </button>
  );
}
