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
