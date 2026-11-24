import { timingSafeEqual } from 'node:crypto'
import { count, max } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches } from '#/db/schema.ts'
import {
  GLITCH_LOCATIONS,
  computeMagicLevel,
  type GlitchLocation,
  type GlitchStatus,
} from '#/lib/glitch.ts'

type PerArea = Record<GlitchLocation, number>

export type GridState = {
  /** Integer 0-100: the level behind the dashboard orb (share of fugitives captured). */
  magic: number
  /** Integer 0-100: the "Danger level" the dashboard shows, always 100 - magic. */
  danger: number
  /** Open (not FIXED) bounties per area; all six keys are always present. */
  areas: PerArea
  /** Highest threat (1-5) among the open bounties of each area, 0 when the area is clear. */
  threat: PerArea
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
  const statuses: GlitchStatus[] = []
  for (const row of rows) {
    if (row.status !== 'FIXED') {
      areas[row.location] += row.total
      threat[row.location] = Math.max(threat[row.location], row.topThreat ?? 0)
    }
    for (let i = 0; i < row.total; i++) statuses.push(row.status)
  }

  // Same calculation as the dashboard, so both always show the same number.
  const magic = Math.round(computeMagicLevel(statuses))
  return { magic, danger: 100 - magic, areas, threat }
}

/** True when `key` matches the GRID_KEY env var. Fails closed when GRID_KEY is not set. */
export function isValidGridKey(key: string | null) {
  const expected = process.env.GRID_KEY
  if (!expected || !key) return false
  const a = Buffer.from(key)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
