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

/** A glitch row on the overview, with its echo count and bounty name. */
export type GlitchSummary = Glitch & {
  echoCount: number
  targetName: string
  objective: 'CAPTURE' | 'BANISH'
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
 * Magic returns as fugitives go back to the Time Prison:
 * the share of fugitives captured (FIXED), in percent. 100 when nobody escaped.
 */
export function computeMagicLevel(statuses: GlitchStatus[]) {
  if (statuses.length === 0) return 100
  const captured = statuses.filter((status) => status === 'FIXED').length
  return Math.round((captured / statuses.length) * 100)
}
