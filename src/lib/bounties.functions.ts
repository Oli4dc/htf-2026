import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { echoes, glitches, guardians } from '#/db/schema.ts'
import { requireCommander, requireGuardian } from '#/lib/auth.server.ts'
import { balanceFor, setBountyStatus } from '#/lib/bounty.server.ts'
import {
  FINAL_STATUS,
  MAX_THREAT,
  MIN_THREAT,
  defaultReward,
  isBountyKind,
  isLocation,
  nextStatus,
  rankTitle,
  type Bounty,
  type BountyDetail,
  type BountyKind,
  type HunterRow,
  type Location,
} from '#/lib/bounty.ts'
import { ECHO_MAX_LENGTH, isGlitchStatus, type GlitchStatus } from '#/lib/glitch.ts'

// --- Input checks ------------------------------------------------------------------

function parseId(value: unknown, what = 'bounty') {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid ${what} id.`)
  return id
}

function parseThreat(value: unknown) {
  const threat = Number(value)
  if (!Number.isInteger(threat) || threat < MIN_THREAT || threat > MAX_THREAT) {
    throw new Error(`Threat must be a whole number from ${MIN_THREAT} to ${MAX_THREAT}.`)
  }
  return threat
}

function parseReward(value: unknown) {
  const reward = Number(value)
  if (!Number.isInteger(reward) || reward < 0 || reward > 100_000) {
    throw new Error('Reward must be a whole number of shards from 0 to 100000.')
  }
  return reward
}

function parseText(value: unknown, label: string, maxLength: number) {
  const text = String(value ?? '').trim()
  if (!text) throw new Error(`${label} is required.`)
  if (text.length > maxLength) throw new Error(`${label}: keep it under ${maxLength} characters.`)
  return text
}

/** The bounty a guardian is currently hunting (claimed and not closed), if any. */
function findActiveHunt(source: Pick<typeof db, 'select'>, guardianId: number) {
  return (
    source
      .select({ glitchId: glitches.glitchId, targetName: glitches.targetName })
      .from(glitches)
      .where(and(eq(glitches.claimedByGuardianId, guardianId), ne(glitches.status, FINAL_STATUS)))
      .orderBy(asc(glitches.glitchId))
      .get() ?? null
  )
}

// --- Reads ---------------------------------------------------------------------------

const bountyColumns = {
  glitchId: glitches.glitchId,
  status: glitches.status,
  description: glitches.description,
  timestamp: glitches.timestamp,
  targetName: glitches.targetName,
  kind: glitches.kind,
  reward: glitches.reward,
  threat: glitches.threat,
  location: glitches.location,
  claimedByGuardianId: glitches.claimedByGuardianId,
  hunter: guardians.codename,
  claimedAt: glitches.claimedAt,
  resolvedAt: glitches.resolvedAt,
  echoCount: count(echoes.echoId),
  lastSeenAt: sql<string>`coalesce(max(${echoes.timestamp}), ${glitches.timestamp})`,
}

function selectBounties() {
  return db
    .select(bountyColumns)
    .from(glitches)
    .leftJoin(guardians, eq(guardians.guardianId, glitches.claimedByGuardianId))
    .leftJoin(echoes, eq(echoes.glitchId, glitches.glitchId))
    .groupBy(glitches.glitchId)
}

/** Open bounties first, then by threat and newest sighting. */
export const getBounties = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Bounty[]> => {
    requireGuardian()
    return selectBounties()
      .orderBy(
        sql`${glitches.resolvedAt} is not null`,
        desc(glitches.threat),
        desc(sql`coalesce(max(${echoes.timestamp}), ${glitches.timestamp})`),
      )
      .all()
  },
)

export const getBounty = createServerFn({ method: 'GET' })
  .validator((glitchId: number) => parseId(glitchId))
  .handler(async ({ data: glitchId }): Promise<BountyDetail> => {
    const guardian = requireGuardian()
    const bounty = selectBounties().where(eq(glitches.glitchId, glitchId)).get()
    if (!bounty) throw notFound()

    const sightings = db
      .select({
        echoId: echoes.echoId,
        description: echoes.description,
        timestamp: echoes.timestamp,
        guardian: { codename: guardians.codename, role: guardians.role },
      })
      .from(echoes)
      .innerJoin(guardians, eq(guardians.guardianId, echoes.reportingGuardianId))
      .where(eq(echoes.glitchId, glitchId))
      .orderBy(asc(echoes.timestamp), asc(echoes.echoId))
      .all()

    const defenders =
      guardian.role === 'commander'
        ? db
            .select({ guardianId: guardians.guardianId, codename: guardians.codename })
            .from(guardians)
            .where(eq(guardians.role, 'defender'))
            .orderBy(asc(guardians.codename))
            .all()
        : []

    const myActiveHunt = findActiveHunt(db, guardian.guardianId)

    return { ...bounty, myActiveHunt, sightings, defenders }
  })

/** "Strongest hunters": every defender, ranked by shards earned. */
export const getLeaderboard = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HunterRow[]> => {
    requireGuardian()
    const rows = db
      .select({
        guardianId: guardians.guardianId,
        codename: guardians.codename,
        shards: sql<number>`coalesce(sum(${glitches.reward}), 0)`,
        captures: count(glitches.glitchId),
        topThreat: sql<number>`coalesce(max(${glitches.threat}), 0)`,
      })
      .from(guardians)
      .leftJoin(
        glitches,
        and(
          eq(glitches.claimedByGuardianId, guardians.guardianId),
          isNotNull(glitches.resolvedAt),
        ),
      )
      .where(eq(guardians.role, 'defender'))
      .groupBy(guardians.guardianId)
      .orderBy(desc(sql`coalesce(sum(${glitches.reward}), 0)`), desc(count(glitches.glitchId)), asc(guardians.codename))
      .all()

    // Equal shards share a rank (1, 2, 2, 4).
    return rows.map((row, i) => {
      const shards = Number(row.shards)
      const firstEqual = rows.findIndex((r) => Number(r.shards) === shards)
      return {
        ...row,
        shards,
        topThreat: Number(row.topThreat),
        rank: firstEqual === -1 ? i + 1 : firstEqual + 1,
        title: rankTitle(shards),
      }
    })
  },
)

/** Spendable shards of the logged-in hunter (after roulette), for the header. */
export const getMyShards = createServerFn({ method: 'GET' }).handler(async () => {
  const guardian = requireGuardian()
  return balanceFor(guardian.guardianId)
})

// --- Hunting ---------------------------------------------------------------------------

/** A defender takes an unclaimed bounty. One hunter per bounty. */
export const claimBounty = createServerFn({ method: 'POST' })
  .validator((glitchId: number) => parseId(glitchId))
  .handler(async ({ data: glitchId }) => {
    const guardian = requireGuardian()
    if (guardian.role !== 'defender') {
      throw new Error('Only hunters claim bounties. Commanders assign them instead.')
    }

    db.transaction((tx) => {
      const bounty = tx
        .select({ status: glitches.status, claimedBy: glitches.claimedByGuardianId })
        .from(glitches)
        .where(eq(glitches.glitchId, glitchId))
        .get()
      if (!bounty) throw new Error('That bounty no longer exists.')
      if (bounty.status === FINAL_STATUS) throw new Error('This bounty is already closed.')

      // One hunter, one active bounty: checked inside the transaction so two quick claims can't both pass.
      const current = findActiveHunt(tx, guardian.guardianId)
      if (current) {
        throw new Error(`You're already hunting ${current.targetName}. Capture or release it first.`)
      }

      // The claimed_by check in the WHERE keeps two hunters from claiming at once.
      const result = tx
        .update(glitches)
        .set({
          claimedByGuardianId: guardian.guardianId,
          // Start of the hunter's travel to the bounty's area (shown in the app and on the Roblox map).
          claimedAt: new Date().toISOString(),
          status: bounty.status === 'LEAKED' ? 'ASSESSING' : bounty.status,
        })
        .where(and(eq(glitches.glitchId, glitchId), isNull(glitches.claimedByGuardianId)))
        .run()
      if (result.changes === 0) throw new Error('Another hunter got there first.')
    })
  })

/** The hunter gives up an open bounty: it is wanted again and anyone can claim it. */
export const releaseBounty = createServerFn({ method: 'POST' })
  .validator((glitchId: number) => parseId(glitchId))
  .handler(async ({ data: glitchId }) => {
    const guardian = requireGuardian()
    // Hunter and open status are checked in the WHERE, so a capture at the same moment wins.
    const result = db
      .update(glitches)
      .set({ claimedByGuardianId: null, claimedAt: null, status: 'LEAKED' })
      .where(
        and(
          eq(glitches.glitchId, glitchId),
          eq(glitches.claimedByGuardianId, guardian.guardianId),
          ne(glitches.status, FINAL_STATUS),
        ),
      )
      .run()
    if (result.changes === 0) throw new Error('You can only release an open bounty you are hunting.')
  })

/**
 * Moves the hunt along. The claiming hunter can only go one step forward;
 * a commander can set any status, also backwards.
 */
export const advanceBounty = createServerFn({ method: 'POST' })
  .validator((data: { glitchId: number; status?: GlitchStatus }) => {
    if (data.status !== undefined && !isGlitchStatus(data.status)) throw new Error('Unknown status.')
    return { glitchId: parseId(data.glitchId), status: data.status }
  })
  .handler(async ({ data }) => {
    const guardian = requireGuardian()
    db.transaction((tx) => {
      const bounty = tx
        .select({ status: glitches.status, claimedBy: glitches.claimedByGuardianId })
        .from(glitches)
        .where(eq(glitches.glitchId, data.glitchId))
        .get()
      if (!bounty) throw new Error('That bounty no longer exists.')

      const next = nextStatus(bounty.status)
      if (guardian.role === 'commander') {
        const target = data.status ?? next
        if (!target) throw new Error('This bounty is already closed.')
        setBountyStatus(data.glitchId, target, tx)
        return
      }

      if (bounty.claimedBy !== guardian.guardianId) {
        throw new Error('Only the hunter on this bounty, or a commander, can move it.')
      }
      if (!next) throw new Error('This bounty is already closed.')
      if (data.status !== undefined && data.status !== next) {
        throw new Error('Hunters can only move a bounty one step forward.')
      }
      setBountyStatus(data.glitchId, next, tx)
    })
  })

// --- Commander tools -------------------------------------------------------------------

type PostBountyInput = {
  targetName: string
  description: string
  kind: BountyKind
  threat: number
  location: Location
  reward?: number
}

/** A commander posts a bounty; the description becomes its first sighting. */
export const postBounty = createServerFn({ method: 'POST' })
  .validator((data: PostBountyInput) => {
    if (!isBountyKind(data.kind)) throw new Error('Unknown kind.')
    if (!isLocation(data.location)) throw new Error('Unknown location.')
    const threat = parseThreat(data.threat)
    return {
      targetName: parseText(data.targetName, 'Target name', 80),
      description: parseText(data.description, 'Description', ECHO_MAX_LENGTH),
      kind: data.kind,
      threat,
      location: data.location,
      reward:
        data.reward === undefined || data.reward === null || String(data.reward) === ''
          ? defaultReward(threat, data.kind)
          : parseReward(data.reward),
    }
  })
  .handler(async ({ data }): Promise<{ glitchId: number }> => {
    const commander = requireCommander()
    const timestamp = new Date().toISOString()
    return db.transaction((tx) => {
      const { glitchId } = tx
        .insert(glitches)
        .values({ ...data, status: 'LEAKED', timestamp })
        .returning({ glitchId: glitches.glitchId })
        .get()
      tx.insert(echoes)
        .values({
          description: data.description,
          timestamp,
          reportingGuardianId: commander.guardianId,
          glitchId,
        })
        .run()
      return { glitchId }
    })
  })

/** A commander changes the reward and/or threat. */
export const updateBountyTerms = createServerFn({ method: 'POST' })
  .validator((data: { glitchId: number; reward?: number; threat?: number }) => ({
    glitchId: parseId(data.glitchId),
    reward: data.reward === undefined ? undefined : parseReward(data.reward),
    threat: data.threat === undefined ? undefined : parseThreat(data.threat),
  }))
  .handler(async ({ data }) => {
    requireCommander()
    const changes: { reward?: number; threat?: number } = {}
    if (data.reward !== undefined) changes.reward = data.reward
    if (data.threat !== undefined) changes.threat = data.threat
    if (Object.keys(changes).length === 0) return
    db.update(glitches).set(changes).where(eq(glitches.glitchId, data.glitchId)).run()
  })

/** A commander assigns a bounty to a defender, or unclaims it with guardianId null. */
export const assignBounty = createServerFn({ method: 'POST' })
  .validator((data: { glitchId: number; guardianId: number | null }) => ({
    glitchId: parseId(data.glitchId),
    guardianId: data.guardianId === null ? null : parseId(data.guardianId, 'guardian'),
  }))
  .handler(async ({ data }) => {
    requireCommander()
    db.transaction((tx) => {
      const bounty = tx
        .select({ status: glitches.status, claimedBy: glitches.claimedByGuardianId })
        .from(glitches)
        .where(eq(glitches.glitchId, data.glitchId))
        .get()
      if (!bounty) throw new Error('That bounty no longer exists.')

      if (data.guardianId !== null) {
        const hunter = tx
          .select({ role: guardians.role })
          .from(guardians)
          .where(eq(guardians.guardianId, data.guardianId))
          .get()
        if (!hunter) throw new Error('That guardian does not exist.')
        if (hunter.role !== 'defender') throw new Error('Bounties go to hunters.')

        // Same rule as claiming: a hunter holds one open bounty at a time.
        const current = findActiveHunt(tx, data.guardianId)
        if (bounty.status !== FINAL_STATUS && current && current.glitchId !== data.glitchId) {
          throw new Error(`That hunter is already on ${current.targetName}. Unassign them there first.`)
        }
      }

      tx.update(glitches)
        .set({
          claimedByGuardianId: data.guardianId,
          // A new hunter starts travelling now; re-saving the same hunter keeps their travel; unclaimed clears it.
          ...(data.guardianId === null
            ? { claimedAt: null }
            : data.guardianId !== bounty.claimedBy
              ? { claimedAt: new Date().toISOString() }
              : {}),
          // A wanted bounty that gets a hunter is being tracked.
          ...(data.guardianId !== null && bounty.status === 'LEAKED'
            ? { status: 'ASSESSING' as const }
            : {}),
        })
        .where(eq(glitches.glitchId, data.glitchId))
        .run()
    })
  })
