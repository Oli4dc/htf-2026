import { huntLabel, type BountyObjective } from '#/lib/bounty.ts'
import type { GlitchStatus } from '#/lib/glitch.ts'

// The database keeps LEAKED/ASSESSING/CONTAINING/FIXED; the UI shows the bounty hunt.
export const statusMeta: Record<GlitchStatus, { label: string; hint: string }> = {
  LEAKED: { label: 'Wanted', hint: 'On the loose, no hunter yet' },
  ASSESSING: { label: 'Tracking', hint: 'A hunter is on the trail' },
  CONTAINING: { label: 'Cornered', hint: 'Wards are closing in' },
  FIXED: { label: 'Captured', hint: 'Captured or banished' },
}

// Solid pills; white text passes contrast on each colour.
const pillColor: Record<GlitchStatus, string> = {
  LEAKED: 'bg-[#c4203a]',
  ASSESSING: 'bg-[#c2620f]',
  CONTAINING: 'bg-[#0e86ad]',
  FIXED: 'bg-[#1a8f3e]',
}

const pillBase =
  'inline-flex justify-center rounded-full font-bold tracking-wide whitespace-nowrap text-white uppercase'

type StatusProps = {
  status: GlitchStatus
  /** With BANISH the final status reads BANISHED instead of CAPTURED. */
  objective?: BountyObjective
}

/** Solid uppercase pill, e.g. WANTED in red. */
export function StatusPill({ status, objective }: StatusProps) {
  return (
    <span
      title={statusMeta[status].hint}
      className={`${pillBase} min-w-28 px-3 py-1.5 text-sm ${pillColor[status]}`}
    >
      {huntLabel(status, objective)}
    </span>
  )
}

/** Smaller pill for tight spots such as board columns. */
export function StatusBadge({ status, objective }: StatusProps) {
  return (
    <span className={`${pillBase} px-2.5 py-1 text-xs ${pillColor[status]}`}>
      {status === 'FIXED' && !objective ? 'Captured · Banished' : huntLabel(status, objective)}
    </span>
  )
}
