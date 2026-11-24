/** Lifecycle of a glitch, in order. */
export const GLITCH_STATUSES = [
  'LEAKED',
  'ASSESSING',
  'CONTAINING',
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

/** A glitch row on the overview, with its echo count. */
export type GlitchSummary = Glitch & { echoCount: number }

export type EchoWithGuardian = {
  echoId: number
  description: string
  /** ISO 8601 */
  timestamp: string
  guardian: { codename: string; role: string }
}

export type GlitchDetail = Glitch & { echoes: EchoWithGuardian[] }

/** Display id only, e.g. 142 -> "GL-0142". Never stored. */
export function formatGlitchId(glitchId: number) {
  return `GL-${String(glitchId).padStart(4, '0')}`
}

export const ECHO_MAX_LENGTH = 1000

/** Magic drained from Achrona by one glitch in each status. */
export const MAGIC_COST: Record<GlitchStatus, number> = {
  LEAKED: 12,
  ASSESSING: 8,
  CONTAINING: 4,
  FIXED: 0,
}

/** 100 when nothing is open, never below 0. */
export function computeMagicLevel(statuses: GlitchStatus[]) {
  const drained = statuses.reduce((sum, status) => sum + MAGIC_COST[status], 0)
  return Math.max(0, 100 - drained)
}
