import {
  DRAW,
  DRAW_WINNER_NAME_KEY,
  PERCENT_SCALE,
} from '../constants';
import type { GameMode, PlayerSymbol, Winner } from '../constants';
import type { GameState } from '../state/transitions';

export interface MatchRecord {
  id: string;
  date: string;
  mode: GameMode;
  playerOne: string;
  playerTwo: string;
  humanSymbol: PlayerSymbol;
  winner: Winner;
  /** Resolved winner name, or the i18n draw key for a drawn match. */
  winnerName: string;
  turns: number;
}

export interface LeaderboardRow {
  name: string;
  wins: number;
  games: number;
  /** Win ratio as a whole-number percentage. */
  winRate: number;
  /** Average number of turns across this player's winning matches. */
  avgTurns: number;
}

/** Builds the immutable record of a finished game. */
export function buildMatchRecord(state: GameState): MatchRecord {
  const winner = (state.winner ?? DRAW) as Winner;

  let winnerName: string;
  if (winner === DRAW) {
    winnerName = DRAW_WINNER_NAME_KEY;
  } else if (winner === state.humanSymbol) {
    winnerName = state.playerOne;
  } else {
    winnerName = state.playerTwo;
  }

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: state.mode,
    playerOne: state.playerOne,
    playerTwo: state.playerTwo,
    humanSymbol: state.humanSymbol,
    winner,
    winnerName,
    turns: state.turnCount,
  };
}

interface Aggregate {
  wins: number;
  games: number;
  winTurns: number;
}

/** Aggregates per-player stats, sorted by wins descending. */
export function buildLeaderboard(records: MatchRecord[]): LeaderboardRow[] {
  const byPlayer = new Map<string, Aggregate>();

  const ensure = (name: string): Aggregate => {
    let aggregate = byPlayer.get(name);
    if (!aggregate) {
      aggregate = { wins: 0, games: 0, winTurns: 0 };
      byPlayer.set(name, aggregate);
    }
    return aggregate;
  };

  for (const record of records) {
    ensure(record.playerOne).games += 1;
    ensure(record.playerTwo).games += 1;
    if (record.winner !== DRAW) {
      const winner = ensure(record.winnerName);
      winner.wins += 1;
      winner.winTurns += record.turns;
    }
  }

  const rows: LeaderboardRow[] = [];
  for (const [name, aggregate] of byPlayer) {
    rows.push({
      name,
      wins: aggregate.wins,
      games: aggregate.games,
      winRate:
        aggregate.games > 0
          ? Math.round((aggregate.wins / aggregate.games) * PERCENT_SCALE)
          : 0,
      avgTurns:
        aggregate.wins > 0 ? Math.round(aggregate.winTurns / aggregate.wins) : 0,
    });
  }

  rows.sort((a, b) => b.wins - a.wins);
  return rows;
}
