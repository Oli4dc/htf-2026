import { Siren } from 'lucide-react'

/** One calm line while any Null Vault fugitive is still unresolved. */
export function PrisonBreakBanner({ atLarge }: { atLarge: number }) {
  if (atLarge === 0) return null
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-950/40 px-4 py-2.5"
    >
      <Siren aria-hidden="true" className="size-5 shrink-0 text-red-300" />
      <p className="text-sm text-red-100">
        <span className="font-semibold">Null Vault breach:</span> {atLarge}{' '}
        {atLarge === 1 ? 'fugitive' : 'fugitives'} at large
      </p>
    </div>
  )
}
