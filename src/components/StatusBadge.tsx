import { huntLabel, type BountyKind } from '#/lib/bounty.ts'
import type { GlitchStatus } from '#/lib/glitch.ts'

// The database keeps LEAKED/ASSESSING/FIXED; the UI shows the bounty hunt.
// Labels come from huntLabel(), which depends on the kind; these are the generic ones.
export const statusMeta: Record<GlitchStatus, { label: string; hint: string }> = {
  LEAKED: { label: 'Wanted / Reported', hint: 'Nobody on it yet' },
  ASSESSING: { label: 'Tracking', hint: 'A hunter is on it' },
  FIXED: { label: 'Captured / Fixed', hint: 'Done' },
}

const kindHint: Record<BountyKind, Record<GlitchStatus, string>> = {
  FUGITIVE: {
    LEAKED: 'On the loose, no hunter yet',
    ASSESSING: 'A hunter is on the trail',
    FIXED: 'Back in the Null Vault',
  },
  ANOMALY: {
    LEAKED: 'Reported, nobody on it yet',
    ASSESSING: 'A hunter is dealing with it',
    FIXED: 'The anomaly is fixed',
  },
}

// Solid pills; white text passes contrast on each colour.
const pillColor: Record<GlitchStatus, string> = {
  LEAKED: 'bg-[#c4203a]',
  ASSESSING: 'bg-[#c2620f]',
  FIXED: 'bg-[#1a8f3e]',
}

const pillBase =
  'inline-flex justify-center rounded-full font-bold tracking-wide whitespace-nowrap text-white uppercase'

type StatusProps = {
  status: GlitchStatus
  /** An anomaly ends as FIXED, a fugitive as CAPTURED. */
  kind?: BountyKind
}

function hint(status: GlitchStatus, kind?: BountyKind) {
  return kind ? kindHint[kind][status] : statusMeta[status].hint
}

/** Solid uppercase pill, e.g. WANTED in red. */
export function StatusPill({ status, kind }: StatusProps) {
  return (
    <span
      title={hint(status, kind)}
      className={`${pillBase} min-w-28 px-3 py-1.5 text-sm ${pillColor[status]}`}
    >
      {huntLabel(status, kind)}
    </span>
  )
}

/** Smaller pill for tight spots such as cards. */
export function StatusBadge({ status, kind }: StatusProps) {
  return (
    <span title={hint(status, kind)} className={`${pillBase} px-2.5 py-1 text-xs ${pillColor[status]}`}>
      {huntLabel(status, kind)}
    </span>
  )
}
