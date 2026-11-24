/** Lifecycle of a glitch, in order. */
export const GLITCH_STATUSES = [
  'LEAKED',
  'ASSESSING',
  'FIXED',
] as const

export type GlitchStatus = (typeof GLITCH_STATUSES)[number]

export function isGlitchStatus(value: unknown): value is GlitchStatus {
  return GLITCH_STATUSES.includes(value as GlitchStatus)
}

/** Areas of Achrona. The keys are shared with the Roblox client: do not rename them. */
export const GLITCH_LOCATIONS = [
  'central_nexus',
  'crystal_spire',
  'citadel',
  'portal_gate',
  'archive',
  'forge',
] as const

export type GlitchLocation = (typeof GLITCH_LOCATIONS)[number]

export const locationLabel: Record<GlitchLocation, string> = {
  central_nexus: 'Central Nexus',
  crystal_spire: 'Crystal Spire',
  citadel: 'Citadel',
  portal_gate: 'Portal Gate',
  archive: 'Archive',
  forge: 'Forge',
}

export function isGlitchLocation(value: unknown): value is GlitchLocation {
  return GLITCH_LOCATIONS.includes(value as GlitchLocation)
}

export type Glitch = {
  glitchId: number
  status: GlitchStatus
  location: GlitchLocation
  description: string
  /** ISO 8601 */
  timestamp: string
}

/** A glitch row on the overview, with its echo count and bounty name. */
export type GlitchSummary = Glitch & {
  echoCount: number
  targetName: string
  /** Decides the final label: a fugitive is Captured, an anomaly Fixed. */
  kind: 'FUGITIVE' | 'ANOMALY'
}

export type EchoWithGuardian = {
  echoId: number
  description: string
  /** ISO 8601 */
  timestamp: string
  guardian: { codename: string; role: string }
}

export type GlitchDetail = Glitch & { echoes: EchoWithGuardian[] }

/**
 * Display id only, e.g. 142 -> "FG-0142". Never stored.
 * Each glitch is one escaped prisoner (a fugitive) in the UI.
 */
export function formatGlitchId(glitchId: number) {
  return `FG-${String(glitchId).padStart(4, '0')}`
}

export const ECHO_MAX_LENGTH = 1000

/**
 * Open bounties that count towards the danger per area: one slot, so an area with any open bounty
 * counts as hit and more bounties there add nothing. The Roblox map also shows one incident per island.
 */
export const MAX_INCIDENTS_PER_AREA = 1

/**
 * Magic level in percent (danger = 100 - magic). Each area fills at most MAX_INCIDENTS_PER_AREA slots,
 * so danger is the share of areas in trouble: one bounty is one area of six, not 100% danger, and
 * 100% danger means every area has an open bounty. 100 when nothing is open.
 */
export function computeMagicLevel(bounties: { status: GlitchStatus; location: GlitchLocation }[]) {
  const open = new Map<GlitchLocation, number>()
  for (const { status, location } of bounties) {
    if (status !== 'FIXED') open.set(location, (open.get(location) ?? 0) + 1)
  }
  let filled = 0
  for (const total of open.values()) filled += Math.min(total, MAX_INCIDENTS_PER_AREA)
  const capacity = GLITCH_LOCATIONS.length * MAX_INCIDENTS_PER_AREA
  return Math.round(100 - (filled / capacity) * 100)
}
