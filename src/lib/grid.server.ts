import { timingSafeEqual } from 'node:crypto'
import { count, eq, max, ne } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches, guardians } from '#/db/schema.ts'
import { hunterStandings } from '#/lib/bounty.server.ts'
import {
  mapEventFor,
  travelProgress,
  travelState,
  type BountyKind,
  type MapEventType,
  type TravelState,
} from '#/lib/bounty.ts'
import {
  GLITCH_LOCATIONS,
  computeMagicLevel,
  type GlitchLocation,
  type GlitchStatus,
} from '#/lib/glitch.ts'

type PerArea = Record<GlitchLocation, number>

export type GridState = {
  /** Integer 0-100: the level behind the dashboard orb (see computeMagicLevel). */
  magic: number
  /** Integer 0-100: the "Danger level" the dashboard shows, always 100 - magic. */
  danger: number
  /** Open (not FIXED) bounties per area; all six keys are always present. */
  areas: PerArea
  /** Highest threat (1-5) among the open bounties of each area, 0 when the area is clear. */
  threat: PerArea
  /** Claimed, still-open bounties: the Roblox map walks a marker with the hunter's codename to the area. */
  hunts: Hunt[]
  /** One visible incident per open bounty; the Roblox map stacks them on the area's island. */
  events: MapEvent[]
  /** Top hunters by shards earned, same ranking as the dashboard's "Strongest hunters". */
  leaderboard: LeaderboardRow[]
}

/** How many hunters the map's leaderboard shows. */
export const MAP_LEADERBOARD_SIZE = 5

export type LeaderboardRow = {
  /** Lets a Roblox player who joined as this hunter spot their own row. */
  guardianId: number
  hunter: string
  shards: number
}

/** Incident shown on the map for a loose bounty. Derived from the words of the report, never stored. */
export type { MapEventType }

export type MapEvent = {
  /** glitch_id: the same bounty always shows the same event. */
  id: number
  area: GlitchLocation
  type: MapEventType
  /** FUGITIVE or ANOMALY: the effect comes from the report's words, so the map needs the kind too. */
  kind: BountyKind
  threat: number
}

export type Hunt = {
  /** glitch_id: stable per bounty, so clients can tell new hunts from ones they already show. */
  id: number
  /** Codename of the guardian who claimed the bounty. */
  hunter: string
  /** That guardian's id: a Roblox player who joined as this hunter sees the marker as "You". */
  guardianId: number
  area: GlitchLocation
  threat: number
  /** 0..1 share of the hunter's travel from the Citadel to the area (HUNT_TRAVEL_SECONDS long). */
  progress: number
  state: TravelState
}

const emptyAreas = () => Object.fromEntries(GLITCH_LOCATIONS.map((area) => [area, 0])) as PerArea

/** State of Achrona for external clients. One grouped query: it is polled every 2 seconds. */
export function getGridState(): GridState {
  const rows = db
    .select({
      location: glitches.location,
      status: glitches.status,
      total: count(),
      topThreat: max(glitches.threat),
    })
    .from(glitches)
    .groupBy(glitches.location, glitches.status)
    .all()

  const areas = emptyAreas()
  const threat = emptyAreas()
  const bounties: { status: GlitchStatus; location: GlitchLocation }[] = []
  for (const row of rows) {
    if (row.status !== 'FIXED') {
      areas[row.location] += row.total
      threat[row.location] = Math.max(threat[row.location], row.topThreat ?? 0)
    }
    for (let i = 0; i < row.total; i++) bounties.push({ status: row.status, location: row.location })
  }

  // Same calculation as the dashboard, so both always show the same number.
  const magic = Math.round(computeMagicLevel(bounties))

  // Inner join skips unclaimed bounties; claimed_by_guardian_id is indexed, so this stays cheap at a 2 s poll.
  const now = Date.now()
  const hunts: Hunt[] = db
    .select({
      id: glitches.glitchId,
      hunter: guardians.codename,
      guardianId: guardians.guardianId,
      area: glitches.location,
      threat: glitches.threat,
      claimedAt: glitches.claimedAt,
    })
    .from(glitches)
    .innerJoin(guardians, eq(glitches.claimedByGuardianId, guardians.guardianId))
    .where(ne(glitches.status, 'FIXED'))
    .orderBy(glitches.glitchId)
    .all()
    .map(({ claimedAt, ...hunt }) => {
      // Same helper as the app's "Traveling to …" bar, so the map and the app agree.
      const progress = Math.round(travelProgress(claimedAt, now) * 100) / 100
      return { ...hunt, progress, state: travelState(progress) }
    })

  const events: MapEvent[] = db
    .select({
      id: glitches.glitchId,
      area: glitches.location,
      kind: glitches.kind,
      targetName: glitches.targetName,
      description: glitches.description,
      threat: glitches.threat,
    })
    .from(glitches)
    .where(ne(glitches.status, 'FIXED'))
    .orderBy(glitches.glitchId)
    .all()
    // "fire" in the title gives a fire, "crash" a crash, and so on (word lists in bounty.ts).
    .map(({ kind, targetName, description, ...event }) => ({
      ...event,
      kind,
      type: mapEventFor({ kind, targetName, description }),
    }))

  const leaderboard: LeaderboardRow[] = hunterStandings()
    .slice(0, MAP_LEADERBOARD_SIZE)
    .map((row) => ({ guardianId: row.guardianId, hunter: row.codename, shards: Number(row.shards) }))

  return { magic, danger: 100 - magic, areas, threat, hunts, events, leaderboard }
}

/** True when `key` matches the GRID_KEY env var. Fails closed when GRID_KEY is not set. */
export function isValidGridKey(key: string | null) {
  const expected = process.env.GRID_KEY
  if (!expected || !key) return false
  const a = Buffer.from(key)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
