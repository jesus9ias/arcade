import { getCells } from '../lib/engine/piece';
import type { TetriminoType } from '../lib/engine/piece';
import { PIECE_COLORS } from '../lib/constants/pieces';

interface Props {
  type: TetriminoType | null;
  className: string;
  cellShadowBlur?: number;
}

// Renders a tetrimino's spawn shape inside a small CSS grid (hold slot / next).
export function PieceGrid({ type, className, cellShadowBlur = 6 }: Props) {
  if (!type) return <div className={className} aria-hidden="true" />;
  const { main, glow } = PIECE_COLORS[type];
  const cells = getCells(type, 0);
  return (
    <div className={className} aria-hidden="true">
      {cells.map((c, i) => (
        <div
          key={i}
          className="mini-cell"
          style={{
            gridColumn: c.x + 1,
            gridRow: c.y + 1,
            background: main,
            boxShadow: `0 0 ${cellShadowBlur}px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.25)`,
          }}
        />
      ))}
    </div>
  );
}
