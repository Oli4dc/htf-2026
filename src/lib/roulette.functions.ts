import { randomInt } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { rouletteSpins } from '#/db/schema.ts'
import { requireGuardian } from '#/lib/auth.server.ts'
import { balanceFor } from '#/lib/bounty.server.ts'
import { MAX_WAGER, isRouletteBet, payoutFor, type RouletteBet, type Spin } from '#/lib/roulette.ts'

export const getRoulette = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ balance: number; spins: Spin[] }> => {
    const guardian = requireGuardian()
    const spins = db
      .select({
        spinId: rouletteSpins.spinId,
        bet: rouletteSpins.bet,
        wager: rouletteSpins.wager,
        result: rouletteSpins.result,
        payout: rouletteSpins.payout,
        createdAt: rouletteSpins.createdAt,
      })
      .from(rouletteSpins)
      .where(eq(rouletteSpins.guardianId, guardian.guardianId))
      .orderBy(desc(rouletteSpins.spinId))
      .limit(8)
      .all()
    return { balance: balanceFor(guardian.guardianId), spins }
  },
)

/** The ball is drawn here, never in the browser, and the bet can't exceed the balance. */
export const spinRoulette = createServerFn({ method: 'POST' })
  .validator((data: { bet: RouletteBet; wager: number }) => {
    if (!isRouletteBet(data.bet)) throw new Error('Pick red, black, green or a number from 0 to 36.')
    const wager = Number(data.wager)
    if (!Number.isInteger(wager) || wager < 1) throw new Error('Bet at least 1 shard.')
    if (wager > MAX_WAGER) throw new Error(`The house takes at most ${MAX_WAGER} shards per spin.`)
    return { bet: data.bet, wager }
  })
  .handler(async ({ data }): Promise<Spin & { balance: number }> => {
    const guardian = requireGuardian()
    return db.transaction((tx) => {
      const balance = balanceFor(guardian.guardianId, tx)
      if (data.wager > balance) {
        throw new Error(`You only have ${balance} shards. Close a bounty first.`)
      }
      const result = randomInt(0, 37)
      const payout = payoutFor(data.bet, result, data.wager)
      const spin = tx
        .insert(rouletteSpins)
        .values({
          guardianId: guardian.guardianId,
          bet: data.bet,
          wager: data.wager,
          result,
          payout,
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get()
      return {
        spinId: spin.spinId,
        bet: spin.bet,
        wager: spin.wager,
        result: spin.result,
        payout: spin.payout,
        createdAt: spin.createdAt,
        balance: balance - data.wager + payout,
      }
    })
  })
