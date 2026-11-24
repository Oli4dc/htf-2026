import { Siren } from 'lucide-react'

/** Shown while any Null Vault fugitive is still unresolved. */
export function PrisonBreakBanner({ atLarge }: { atLarge: number }) {
  if (atLarge === 0) return null
  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-2xl border border-red-400/60 bg-red-950/60 shadow-[0_0_40px_rgb(255_31_61/0.25)]"
    >
      <div
        aria-hidden="true"
        className="h-2 bg-[repeating-linear-gradient(-45deg,#facc15_0_12px,#111_12px_24px)]"
      />
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_24px_rgb(255_60_80/0.8)] motion-safe:animate-pulse">
          <Siren aria-hidden="true" className="size-7" />
        </span>
        <div>
          <p className="font-heading text-3xl leading-none text-white">
            Null Vault breach: {atLarge} {atLarge === 1 ? 'fugitive' : 'fugitives'} at large
          </p>
          <p className="mt-1 text-sm text-red-200/90">
            Prisoners broke out of the Null Vault. Claim their bounties and drag them back.
          </p>
        </div>
      </div>
    </div>
  )
}
