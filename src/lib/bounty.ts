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

// One list of areas for the whole app (and the Roblox client): it lives in glitch.ts.
export const LOCATIONS = GLITCH_LOCATIONS
export type Location = GlitchLocation
export const LOCATION_LABELS = locationLabel

export const MIN_THREAT = 1
export const MAX_THREAT = 5

export const DEFAULT_TARGET_NAME = 'Unidentified anomaly'

/** Final status in the database. Reaching it resolves the bounty and pays out. */
export const FINAL_STATUS: GlitchStatus = 'FIXED'

// --- Travel ------------------------------------------------------------------------
// A hunter who takes a bounty first travels from the Citadel to its area. The app and the
// Roblox map both derive the travel from claimed_at, so they agree on where the hunter is.

/** Seconds from claiming a bounty to being on site. The Roblox client uses the same number. */
export const HUNT_TRAVEL_SECONDS = 15

export type TravelState = 'traveling' | 'on_site'

/** 0..1 share of the travel done. Bounties claimed before claimed_at existed count as on site. */
export function travelProgress(claimedAt: string | null, now = Date.now()) {
  if (!claimedAt) return 1
  const elapsed = (now - Date.parse(claimedAt)) / 1000
  if (!Number.isFinite(elapsed)) return 1
  return Math.min(1, Math.max(0, elapsed / HUNT_TRAVEL_SECONDS))
}

export function travelState(progress: number): TravelState {
  return progress >= 1 ? 'on_site' : 'traveling'
}

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

// --- Status as hunters see it -------------------------------------------------
// The database keeps LEAKED/ASSESSING/FIXED; the UI shows the hunt.

const HUNT_LABELS: Record<GlitchStatus, string> = {
  LEAKED: 'Wanted',
  ASSESSING: 'Tracking',
  FIXED: 'Captured',
}

/** "Wanted", "Tracking" or "Captured". */
export function huntLabel(status: GlitchStatus) {
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
  reward: number
  threat: number
  location: Location
  claimedByGuardianId: number | null
  /** Codename of the hunter, if claimed. */
  hunter: string | null
  /** ISO 8601, when the current hunter claimed it (start of their travel). */
  claimedAt: string | null
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

/** A hunter holds one active (not FIXED) bounty at a time; this is the one they hold. */
export type ActiveHunt = { glitchId: number; targetName: string }

export function activeHuntOf(bounties: Bounty[], guardianId: number): ActiveHunt | null {
  const hunt = bounties.find((b) => b.claimedByGuardianId === guardianId && b.status !== FINAL_STATUS)
  return hunt ? { glitchId: hunt.glitchId, targetName: hunt.targetName } : null
}

export type BountyDetail = Bounty & {
  /** The viewer's own active hunt (any bounty), so the page can explain why Claim is locked. */
  myActiveHunt: ActiveHunt | null
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
