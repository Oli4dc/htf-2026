// Bounty hunt rules shared by the schema, the server and the UI.
// A bounty IS a glitch; a sighting IS an echo. Keep this file free of
// server-only imports: drizzle-kit and the browser both load it.
import {
  GLITCH_LOCATIONS,
  GLITCH_STATUSES,
  locationLabel,
  type GlitchLocation,
  type GlitchStatus,
} from './glitch.ts'

/** FUGITIVE escaped from the Null Vault; ANOMALY is a general bounty. */
export const BOUNTY_KINDS = ['FUGITIVE', 'ANOMALY'] as const
export type BountyKind = (typeof BOUNTY_KINDS)[number]

export const BOUNTY_OBJECTIVES = ['CAPTURE', 'BANISH'] as const
export type BountyObjective = (typeof BOUNTY_OBJECTIVES)[number]

// One list of areas for the whole app (and the Roblox client): it lives in glitch.ts.
export const LOCATIONS = GLITCH_LOCATIONS
export type Location = GlitchLocation
export const LOCATION_LABELS = locationLabel

export const MIN_THREAT = 1
export const MAX_THREAT = 5

export const DEFAULT_TARGET_NAME = 'Unidentified anomaly'

/** Final status in the database. Reaching it resolves the bounty and pays out. */
export const FINAL_STATUS: GlitchStatus = 'FIXED'

/** Shards paid for a bounty: 100 per threat level, fugitives pay 1.5x. */
export function defaultReward(threat: number, kind: BountyKind = 'ANOMALY') {
  return Math.round(clampThreat(threat) * 100 * (kind === 'FUGITIVE' ? 1.5 : 1))
}

export function clampThreat(threat: number) {
  return Math.min(MAX_THREAT, Math.max(MIN_THREAT, Math.round(threat)))
}

export function isLocation(value: unknown): value is Location {
  return LOCATIONS.includes(value as Location)
}

export function isBountyKind(value: unknown): value is BountyKind {
  return BOUNTY_KINDS.includes(value as BountyKind)
}

export function isBountyObjective(value: unknown): value is BountyObjective {
  return BOUNTY_OBJECTIVES.includes(value as BountyObjective)
}

// --- Status as hunters see it -------------------------------------------------
// The database keeps LEAKED/ASSESSING/CONTAINING/FIXED; the UI shows the hunt.

const HUNT_LABELS: Record<GlitchStatus, string> = {
  LEAKED: 'Wanted',
  ASSESSING: 'Tracking',
  CONTAINING: 'Cornered',
  FIXED: 'Captured',
}

/** "Wanted", "Tracking", "Cornered", then "Captured" or "Banished" by objective. */
export function huntLabel(status: GlitchStatus, objective?: BountyObjective) {
  if (status === FINAL_STATUS && objective === 'BANISH') return 'Banished'
  return HUNT_LABELS[status]
}

/** The status after this one, or null at the end of the hunt. */
export function nextStatus(status: GlitchStatus): GlitchStatus | null {
  return GLITCH_STATUSES[GLITCH_STATUSES.indexOf(status) + 1] ?? null
}

// --- Hunters ---------------------------------------------------------------------

/** Rank title by total shards earned. */
export const RANKS = [
  { title: 'Archon', minShards: 1500 },
  { title: 'Warden', minShards: 800 },
  { title: 'Tracker', minShards: 300 },
  { title: 'Initiate', minShards: 0 },
] as const

export function rankTitle(shards: number) {
  return RANKS.find((rank) => shards >= rank.minShards)!.title
}

// --- Shapes returned by the server -----------------------------------------------

export type Bounty = {
  glitchId: number
  status: GlitchStatus
  description: string
  /** ISO 8601, when the bounty was opened. */
  timestamp: string
  targetName: string
  kind: BountyKind
  objective: BountyObjective
  reward: number
  threat: number
  location: Location
  claimedByGuardianId: number | null
  /** Codename of the hunter, if claimed. */
  hunter: string | null
  resolvedAt: string | null
  echoCount: number
  /** ISO 8601 of the latest sighting. */
  lastSeenAt: string
}

export type Sighting = {
  echoId: number
  description: string
  timestamp: string
  guardian: { codename: string; role: string }
}

export type BountyDetail = Bounty & {
  sightings: Sighting[]
  /** Defenders a commander can assign; empty for everyone else. */
  defenders: { guardianId: number; codename: string }[]
}

export type HunterRow = {
  guardianId: number
  codename: string
  shards: number
  captures: number
  /** Highest threat among resolved bounties, 0 if none. */
  topThreat: number
  rank: number
  title: string
}
