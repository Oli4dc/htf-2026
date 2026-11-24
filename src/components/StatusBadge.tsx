import { huntLabel } from '#/lib/bounty.ts'
import type { GlitchStatus } from '#/lib/glitch.ts'

// The database keeps LEAKED/ASSESSING/FIXED; the UI shows the bounty hunt.
export const statusMeta: Record<GlitchStatus, { label: string; hint: string }> = {
  LEAKED: { label: 'Wanted', hint: 'On the loose, no hunter yet' },
  ASSESSING: { label: 'Tracking', hint: 'A hunter is on the trail' },
  FIXED: { label: 'Captured', hint: 'Back in the Null Vault' },
}

// Solid pills; white text passes contrast on each colour.
const pillColor: Record<GlitchStatus, string> = {
  LEAKED: 'bg-[#c4203a]',
  ASSESSING: 'bg-[#c2620f]',
  FIXED: 'bg-[#1a8f3e]',
}

const pillBase =
  'inline-flex justify-center rounded-full font-bold tracking-wide whitespace-nowrap text-white uppercase'

/** Solid uppercase pill, e.g. WANTED in red. */
export function StatusPill({ status }: { status: GlitchStatus }) {
  return (
    <span
      title={statusMeta[status].hint}
      className={`${pillBase} min-w-28 px-3 py-1.5 text-sm ${pillColor[status]}`}
    >
      {huntLabel(status)}
    </span>
  )
}

/** Smaller pill for tight spots such as board columns. */
export function StatusBadge({ status }: { status: GlitchStatus }) {
  return (
    <span className={`${pillBase} px-2.5 py-1 text-xs ${pillColor[status]}`}>
      {huntLabel(status)}
    </span>
  )
}
