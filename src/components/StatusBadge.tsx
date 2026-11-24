import type { GlitchStatus } from '#/lib/glitch.ts'

export const statusMeta: Record<GlitchStatus, { label: string; hint: string }> = {
  LEAKED: { label: 'Leaked', hint: 'Reported, nobody on it yet' },
  ASSESSING: { label: 'Assessing', hint: 'Guardians are studying it' },
  CONTAINING: { label: 'Containing', hint: 'Wards are being raised' },
  FIXED: { label: 'Fixed', hint: 'Magic restored' },
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

/** Solid uppercase pill, e.g. LEAKED in red. */
export function StatusPill({ status }: { status: GlitchStatus }) {
  return (
    <span className={`${pillBase} min-w-28 px-3 py-1.5 text-sm ${pillColor[status]}`}>
      {status}
    </span>
  )
}

/** Smaller pill for tight spots such as board columns. */
export function StatusBadge({ status }: { status: GlitchStatus }) {
  return <span className={`${pillBase} px-2.5 py-1 text-xs ${pillColor[status]}`}>{status}</span>
}
