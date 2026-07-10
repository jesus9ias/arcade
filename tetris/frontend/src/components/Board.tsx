import type { ReactNode } from 'react';
import type { Board as BoardModel } from '../lib/engine/board';
import { getAbsoluteCells } from '../lib/engine/piece';
import type { ActivePiece } from '../lib/engine/piece';
import { PIECE_COLORS } from '../lib/constants/pieces';
import { BOARD_WIDTH, BUFFER_HEIGHT, VISIBLE_HEIGHT } from '../lib/constants/game';
import type { CSSProperties } from 'react';

interface Props {
  board: BoardModel;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  overlay?: ReactNode;
}

function solid(type: keyof typeof PIECE_COLORS): CSSProperties {
  const { main, glow } = PIECE_COLORS[type];
  return { background: main, boxShadow: `0 0 8px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.3)` };
}

function ghostStyle(type: keyof typeof PIECE_COLORS): CSSProperties {
  const { glow } = PIECE_COLORS[type];
  return { background: 'transparent', boxShadow: `inset 0 0 0 2px ${glow}` };
}

export function Board({ board, active, ghost, overlay }: Props) {
  const activeCells = new Map<string, keyof typeof PIECE_COLORS>();
  if (active) for (const c of getAbsoluteCells(active)) activeCells.set(`${c.x},${c.y}`, active.type);
  const ghostCells = new Set<string>();
  if (ghost) for (const c of getAbsoluteCells(ghost)) ghostCells.add(`${c.x},${c.y}`);

  const cells: ReactNode[] = [];
  for (let r = 0; r < VISIBLE_HEIGHT; r++) {
    const boardRow = r + BUFFER_HEIGHT;
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const key = `${col},${boardRow}`;
      const activeType = activeCells.get(key);
      const stackType = board[boardRow][col];
      let style: CSSProperties | undefined;
      if (activeType) style = solid(activeType);
      else if (stackType) style = solid(stackType);
      else if (ghostCells.has(key) && ghost) style = ghostStyle(ghost.type);
      cells.push(<div key={key} className="board-cell" style={style} />);
    }
  }

  return (
    <div className="board-frame">
      <div className="board-grid">{cells}</div>
      {overlay}
    </div>
  );
}
