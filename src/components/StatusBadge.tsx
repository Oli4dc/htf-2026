import type { GlitchStatus } from '#/lib/glitch.ts'

export const statusMeta: Record<
  GlitchStatus,
  { label: string; badge: string; dot: string; hint: string }
> = {
  LEAKED: {
    label: 'Leaked',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500 animate-pulse',
    hint: 'Reported, nobody on it yet',
  },
  ASSESSING: {
    label: 'Assessing',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
    hint: 'Guardians are studying it',
  },
  CONTAINING: {
    label: 'Containing',
    badge: 'bg-sky-50 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
    hint: 'Wards are being raised',
  },
  FIXED: {
    label: 'Fixed',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
    hint: 'Magic restored',
  },
}

// Solid pills of the night theme; white text passes contrast on each colour.
const pillColor: Record<GlitchStatus, string> = {
  LEAKED: 'bg-[#c4203a]',
  ASSESSING: 'bg-[#c2620f]',
  CONTAINING: 'bg-[#0e86ad]',
  FIXED: 'bg-[#1a8f3e]',
}

/** Solid uppercase pill, e.g. LEAKED in red. */
export function StatusPill({ status }: { status: GlitchStatus }) {
  return (
    <span
      className={`inline-flex min-w-28 justify-center rounded-full px-3 py-1.5 text-sm font-bold tracking-wide whitespace-nowrap text-white uppercase ${pillColor[status]}`}
    >
      {status}
    </span>
  )
}

export function StatusBadge({ status }: { status: GlitchStatus }) {
  const meta = statusMeta[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
