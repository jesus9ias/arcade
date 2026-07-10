// Hold-slot logic. Swaps the active piece with the hold slot, enforcing the
// per-run cap and the no-consecutive-hold rule. Pure.

import { createPiece } from '../engine/piece';
import type { ActivePiece, TetriminoType } from '../engine/piece';

export interface HoldContext {
  active: ActivePiece;
  hold: TetriminoType | null;
  queue: TetriminoType[];
  holdsRemaining: number;
  holdUsedThisPiece: boolean;
}

export function applyHold<T extends HoldContext>(ctx: T): T {
  if (ctx.holdUsedThisPiece || ctx.holdsRemaining <= 0) return ctx;

  const stored = ctx.active.type;
  let active: ActivePiece;
  let queue = ctx.queue;

  if (ctx.hold === null) {
    active = createPiece(ctx.queue[0]);
    queue = ctx.queue.slice(1);
  } else {
    active = createPiece(ctx.hold);
  }

  return {
    ...ctx,
    active,
    hold: stored,
    queue,
    holdsRemaining: ctx.holdsRemaining - 1,
    holdUsedThisPiece: true,
  };
}
