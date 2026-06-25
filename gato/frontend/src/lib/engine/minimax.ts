import { checkResult, getAvailableCells, placeMove } from './board';
import type { Board } from './board';
import { DRAW } from '../constants';
import type { PlayerSymbol } from '../constants';

/** Base score of a terminal win; depth is subtracted to prefer faster wins. */
const WIN_SCORE = 10;

function opponentOf(symbol: PlayerSymbol): PlayerSymbol {
  return symbol === 'X' ? 'O' : 'X';
}

/** Minimax score of `board` from the AI's perspective, `current` to move. */
function score(
  board: Board,
  current: PlayerSymbol,
  ai: PlayerSymbol,
  depth: number,
): number {
  const result = checkResult(board);
  if (result) {
    if (result.winner === ai) return WIN_SCORE - depth;
    if (result.winner === DRAW) return 0;
    return depth - WIN_SCORE;
  }

  const cells = getAvailableCells(board);
  const next = opponentOf(current);

  if (current === ai) {
    let best = -Infinity;
    for (const cell of cells) {
      best = Math.max(best, score(placeMove(board, cell, current)!, next, ai, depth + 1));
    }
    return best;
  }

  let best = Infinity;
  for (const cell of cells) {
    best = Math.min(best, score(placeMove(board, cell, current)!, next, ai, depth + 1));
  }
  return best;
}

/** Returns the optimal cell index for `ai` on a non-terminal board. */
export function getBestMove(board: Board, ai: PlayerSymbol): number {
  const cells = getAvailableCells(board);
  // `cells` is non-empty for a non-terminal board; 0 is an unreachable fallback.
  let bestCell = cells[0] ?? 0;
  let bestScore = -Infinity;
  for (const cell of cells) {
    const cellScore = score(placeMove(board, cell, ai)!, opponentOf(ai), ai, 1);
    if (cellScore > bestScore) {
      bestScore = cellScore;
      bestCell = cell;
    }
  }
  return bestCell;
}
