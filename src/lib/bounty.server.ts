// Server-only bounty helpers. Call them inside server function handlers.
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches, rouletteSpins } from '#/db/schema.ts'
import { FINAL_STATUS } from '#/lib/bounty.ts'
import type { GlitchStatus } from '#/lib/glitch.ts'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Moves a bounty to a status and keeps resolvedAt in step:
 * set when it reaches the final status, cleared when it leaves it.
 * The reward is not stored anywhere else: shards are summed from resolved bounties.
 */
export function setBountyStatus(glitchId: number, status: GlitchStatus, tx: Tx | typeof db = db) {
  const resolvedAt = status === FINAL_STATUS ? new Date().toISOString() : null
  tx.update(glitches)
    .set({
      status,
      // Keep the original resolve time if it was already resolved.
      resolvedAt:
        resolvedAt === null ? null : sql`coalesce(${glitches.resolvedAt}, ${resolvedAt})`,
    })
    .where(eq(glitches.glitchId, glitchId))
    .run()
}

/**
 * Spendable shards: earned from bounties, plus roulette winnings, minus bets.
 * Pass a transaction to read the balance inside it.
 */
export function balanceFor(guardianId: number, tx: Tx | typeof db = db) {
  const earned = tx
    .select({ shards: sql<number>`coalesce(sum(${glitches.reward}), 0)` })
    .from(glitches)
    .where(and(eq(glitches.claimedByGuardianId, guardianId), isNotNull(glitches.resolvedAt)))
    .get()
  const gambled = tx
    .select({ net: sql<number>`coalesce(sum(${rouletteSpins.payout} - ${rouletteSpins.wager}), 0)` })
    .from(rouletteSpins)
    .where(eq(rouletteSpins.guardianId, guardianId))
    .get()
  return Number(earned?.shards ?? 0) + Number(gambled?.net ?? 0)
}

/** Shards earned by one hunter: rewards of the resolved bounties they claimed. */
export function shardsFor(guardianId: number) {
  const row = db
    .select({ shards: sql<number>`coalesce(sum(${glitches.reward}), 0)` })
    .from(glitches)
    .where(and(eq(glitches.claimedByGuardianId, guardianId), isNotNull(glitches.resolvedAt)))
    .get()
  return Number(row?.shards ?? 0)
}
