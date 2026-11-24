// Hunters who play on the Roblox map. The Roblox server calls these through /api/roblox/join,
// /api/roblox/claim and /api/roblox/fix with the grid key; players never reach them directly.
import { eq, sql } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches, guardians } from '#/db/schema.ts'
import { claimBountyFor, setBountyStatus } from '#/lib/bounty.server.ts'
import { FINAL_STATUS, travelProgress } from '#/lib/bounty.ts'

export const HUNTER_NAME_MIN = 3
export const HUNTER_NAME_MAX = 20
const HUNTER_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/

/** Not a "salt:hash" pair, so verifyPassword always fails: map hunters exist on the dashboard but can't sign in. */
const NO_PASSWORD = 'roblox-map-hunter'

/** A message meant for the player (shown in Roblox as is). */
export class PlayerError extends Error {}

export function parseRobloxUserId(value: unknown) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new PlayerError('Unknown Roblox player.')
  return id
}

export function parseGlitchId(value: unknown) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new PlayerError('That bounty no longer exists.')
  return id
}

/** Trimmed, single spaces, letters/digits/space/_/- only. The Roblox server has already run it through Roblox's text filter. */
export function parseHunterName(value: unknown) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < HUNTER_NAME_MIN || name.length > HUNTER_NAME_MAX) {
    throw new PlayerError(`Pick a name of ${HUNTER_NAME_MIN} to ${HUNTER_NAME_MAX} characters.`)
  }
  if (!HUNTER_NAME_PATTERN.test(name)) throw new PlayerError('Use letters, numbers, spaces, _ or - only.')
  return name
}

/**
 * Makes the Roblox player a hunter on the dashboard. The same Roblox account always gets the same
 * hunter back (with the new name), so its shards and bounties stay with it.
 */
export function joinFromRoblox(robloxUserId: number, name: string) {
  return db.transaction((tx) => {
    const mine = tx
      .select({ guardianId: guardians.guardianId })
      .from(guardians)
      .where(eq(guardians.robloxUserId, robloxUserId))
      .get()
    // Same case-insensitive match the sign-in uses, so two hunters can never share a name.
    const taken = tx
      .select({ guardianId: guardians.guardianId })
      .from(guardians)
      .where(sql`lower(${guardians.codename}) = ${name.toLowerCase()}`)
      .get()
    if (taken && taken.guardianId !== mine?.guardianId) {
      throw new PlayerError('That name is taken. Pick another one.')
    }
    if (mine) {
      tx.update(guardians).set({ codename: name }).where(eq(guardians.guardianId, mine.guardianId)).run()
      return { guardianId: mine.guardianId, codename: name }
    }
    const created = tx
      .insert(guardians)
      .values({ codename: name, role: 'defender', passwordHash: NO_PASSWORD, robloxUserId })
      .returning({ guardianId: guardians.guardianId })
      .get()
    return { guardianId: created.guardianId, codename: name }
  })
}

/** The Roblox player's hunter takes a bounty, under the same rules as the app's Claim button. */
export function claimFromRoblox(robloxUserId: number, glitchId: number) {
  const hunter = db
    .select({ guardianId: guardians.guardianId })
    .from(guardians)
    .where(eq(guardians.robloxUserId, robloxUserId))
    .get()
  if (!hunter) throw new PlayerError('Pick a hunter name first.')
  try {
    claimBountyFor(hunter.guardianId, glitchId)
  } catch (err) {
    // claimBountyFor only throws player-facing rule messages.
    throw new PlayerError(err instanceof Error ? err.message : 'Could not take that bounty.')
  }
}

/**
 * The Roblox player's hunter closes their bounty once they are on site: it goes to the final status and
 * pays out, like reaching "Captured" in the app. A map minigame can later sit in front of this call.
 */
export function fixFromRoblox(robloxUserId: number, glitchId: number) {
  const hunter = db
    .select({ guardianId: guardians.guardianId })
    .from(guardians)
    .where(eq(guardians.robloxUserId, robloxUserId))
    .get()
  if (!hunter) throw new PlayerError('Pick a hunter name first.')
  db.transaction((tx) => {
    const bounty = tx
      .select({ status: glitches.status, claimedBy: glitches.claimedByGuardianId, claimedAt: glitches.claimedAt })
      .from(glitches)
      .where(eq(glitches.glitchId, glitchId))
      .get()
    if (!bounty) throw new PlayerError('That bounty no longer exists.')
    if (bounty.status === FINAL_STATUS) throw new PlayerError('This one is already fixed.')
    if (bounty.claimedBy !== hunter.guardianId) throw new PlayerError('Only the hunter on this bounty can fix it.')
    // Same travel clock as the map and the app, so nobody fixes a bounty they haven't reached yet.
    if (travelProgress(bounty.claimedAt) < 1) throw new PlayerError("You're not there yet.")
    setBountyStatus(glitchId, FINAL_STATUS, tx)
  })
}
