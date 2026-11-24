// Server-only bounty helpers. Call them inside server function handlers.
import { and, asc, eq, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches, rouletteSpins } from '#/db/schema.ts'
import { FINAL_STATUS } from '#/lib/bounty.ts'
import type { GlitchStatus } from '#/lib/glitch.ts'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** The bounty a guardian is currently hunting (claimed and not closed), if any. */
export function findActiveHunt(source: Pick<typeof db, 'select'>, guardianId: number) {
  return (
    source
      .select({ glitchId: glitches.glitchId, targetName: glitches.targetName })
      .from(glitches)
      .where(and(eq(glitches.claimedByGuardianId, guardianId), ne(glitches.status, FINAL_STATUS)))
      .orderBy(asc(glitches.glitchId))
      .get() ?? null
  )
}

/**
 * A hunter takes a bounty: one active bounty per hunter, one hunter per bounty.
 * Used by the app's Claim button and by hunters playing on the Roblox map. Throws a player-facing message.
 */
export function claimBountyFor(guardianId: number, glitchId: number) {
  db.transaction((tx) => {
    const bounty = tx
      .select({ status: glitches.status, claimedBy: glitches.claimedByGuardianId })
      .from(glitches)
      .where(eq(glitches.glitchId, glitchId))
      .get()
    if (!bounty) throw new Error('That bounty no longer exists.')
    if (bounty.status === FINAL_STATUS) throw new Error('This bounty is already closed.')

    // One hunter, one active bounty: checked inside the transaction so two quick claims can't both pass.
    const current = findActiveHunt(tx, guardianId)
    if (current) {
      throw new Error(`You're already hunting ${current.targetName}. Capture or release it first.`)
    }

    // The claimed_by check in the WHERE keeps two hunters from claiming at once.
    const result = tx
      .update(glitches)
      .set({
        claimedByGuardianId: guardianId,
        // Start of the hunter's travel to the bounty's area (shown in the app and on the Roblox map).
        claimedAt: new Date().toISOString(),
        status: bounty.status === 'LEAKED' ? 'ASSESSING' : bounty.status,
      })
      .where(and(eq(glitches.glitchId, glitchId), isNull(glitches.claimedByGuardianId)))
      .run()
    if (result.changes === 0) throw new Error('Another hunter got there first.')
  })
}

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
