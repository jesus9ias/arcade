import type { Board as BoardType } from '../lib/engine/board';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  winningLine: number[] | null;
  disabled: boolean;
  onPlay: (index: number) => void;
}

export function Board({ board, winningLine, disabled, onPlay }: BoardProps) {
  return (
    <div className="board">
      {board.map((value, index) => (
        <Cell
          key={index}
          index={index}
          value={value}
          highlighted={winningLine?.includes(index) ?? false}
          disabled={disabled}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
}
