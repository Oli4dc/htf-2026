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

export type Glitch = {
  glitchId: number
  status: GlitchStatus
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
