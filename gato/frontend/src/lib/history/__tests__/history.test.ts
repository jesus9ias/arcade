import { describe, it, expect } from 'vitest';
import { buildMatchRecord, buildLeaderboard } from '../history';
import { GameStatus, GameMode } from '../../constants';
import type { Board } from '../../engine/board';

// Stage 2 failing tests — lib/history (T-HIST-*). Implementation arrives in Stage 3.

// A finished HVM game state (X won row [0,1,2] unless overridden to a draw).
const finishedState = (
  winner: 'X' | 'O' | 'DRAW',
  opts: { humanSymbol?: 'X' | 'O'; playerOne?: string; playerTwo?: string } = {},
) => {
  const board: Board = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
  return {
    status: GameStatus.GAME_OVER,
    mode: GameMode.HVM,
    board,
    currentTurn: 'O' as 'X' | 'O',
    humanSymbol: opts.humanSymbol ?? 'X',
    playerOne: opts.playerOne ?? 'Jesús',
    playerTwo: opts.playerTwo ?? 'Machine',
    winner,
    winningLine: winner === 'DRAW' ? null : [0, 1, 2],
    turnCount: 5,
  };
};

const makeRecord = (
  winner: 'X' | 'O' | 'DRAW',
  winnerName: string,
  turns: number,
) => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  mode: GameMode.HVH,
  playerOne: 'Ana',
  playerTwo: 'Luis',
  humanSymbol: 'X' as 'X' | 'O',
  winner,
  winnerName,
  turns,
});

describe('lib/history — buildMatchRecord', () => {
  it('T-HIST-01: produces a valid record with all required fields', () => {
    const record = buildMatchRecord(finishedState('X'));
    expect(typeof record.id).toBe('string');
    expect(record.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(record.date))).toBe(false);
    expect(record.mode).toBe(GameMode.HVM);
    expect(record.turns).toBe(5);
  });

  it('T-HIST-02: resolves the winner name for a human win', () => {
    const record = buildMatchRecord(
      finishedState('X', { humanSymbol: 'X', playerOne: 'Jesús' }),
    );
    expect(record.winnerName).toBe('Jesús');
  });

  it('T-HIST-03: resolves the winner name for a machine win', () => {
    const record = buildMatchRecord(
      finishedState('O', { humanSymbol: 'X', playerTwo: 'Machine' }),
    );
    expect(record.winnerName).toBe('Machine');
  });

  it('T-HIST-04: uses the i18n draw key for a draw', () => {
    const record = buildMatchRecord(finishedState('DRAW'));
    expect(record.winnerName).toBe('history.draw');
  });
});

describe('lib/history — buildLeaderboard', () => {
  it('T-HIST-05: aggregates wins per player, sorted descending', () => {
    const leaderboard = buildLeaderboard([
      makeRecord('X', 'Ana', 5),
      makeRecord('O', 'Luis', 6),
      makeRecord('X', 'Ana', 7),
    ]);
    expect(leaderboard[0]).toMatchObject({ name: 'Ana', wins: 2 });
    expect(leaderboard[1]).toMatchObject({ name: 'Luis', wins: 1 });
  });

  it('T-HIST-06: a draw increments games but not wins', () => {
    const leaderboard = buildLeaderboard([
      makeRecord('DRAW', 'history.draw', 9),
    ]);
    const ana = leaderboard.find((row) => row.name === 'Ana')!;
    expect(ana.games).toBe(1);
    expect(ana.wins).toBe(0);
  });

  it('T-HIST-07: computes average turns per win', () => {
    const leaderboard = buildLeaderboard([
      makeRecord('X', 'Ana', 5),
      makeRecord('X', 'Ana', 7),
    ]);
    const ana = leaderboard.find((row) => row.name === 'Ana')!;
    expect(ana.avgTurns).toBe(6);
  });
});
