import { timingSafeEqual } from 'node:crypto'
import { count } from 'drizzle-orm'
import { db } from '#/db/index.ts'
import { glitches } from '#/db/schema.ts'
import {
  GLITCH_LOCATIONS,
  computeMagicLevel,
  type GlitchLocation,
  type GlitchStatus,
} from '#/lib/glitch.ts'

export type GridState = {
  /** Integer 0-100, the same number as on the dashboard. */
  magic: number
  /** Open (not FIXED) glitches per area; all six keys are always present. */
  areas: Record<GlitchLocation, number>
}

/** State of Achrona for external clients. One grouped query: it is polled every 2 seconds. */
export function getGridState(): GridState {
  const rows = db
    .select({ location: glitches.location, status: glitches.status, total: count() })
    .from(glitches)
    .groupBy(glitches.location, glitches.status)
    .all()

  const areas = Object.fromEntries(GLITCH_LOCATIONS.map((area) => [area, 0])) as GridState['areas']
  const statuses: GlitchStatus[] = []
  for (const row of rows) {
    if (row.status !== 'FIXED') areas[row.location] += row.total
    for (let i = 0; i < row.total; i++) statuses.push(row.status)
  }

  // Same calculation as the dashboard, so both always show the same number.
  return { magic: Math.round(computeMagicLevel(statuses)), areas }
}

/** True when `key` matches the GRID_KEY env var. Fails closed when GRID_KEY is not set. */
export function isValidGridKey(key: string | null) {
  const expected = process.env.GRID_KEY
  if (!expected || !key) return false
  const a = Buffer.from(key)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
