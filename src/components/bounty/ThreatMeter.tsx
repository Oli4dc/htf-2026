import { Skull } from 'lucide-react'
import { MAX_THREAT } from '#/lib/bounty.ts'

/** Threat 1-5 as skulls: lit up to the threat, faded after. */
export function ThreatMeter({ threat, size = 'size-4' }: { threat: number; size?: string }) {
  return (
    <span
      role="img"
      aria-label={`Threat ${threat} of ${MAX_THREAT}`}
      title={`Threat ${threat} of ${MAX_THREAT}`}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: MAX_THREAT }, (_, i) => (
        <Skull
          key={i}
          aria-hidden="true"
          className={`${size} ${i < threat ? 'text-red-400' : 'text-white/15'}`}
          strokeWidth={2}
        />
      ))}
    </span>
  )
}
