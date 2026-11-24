import { useEffect, useState } from 'react'
import { Footprints, MapPin } from 'lucide-react'
import { HUNT_TRAVEL_SECONDS, LOCATION_LABELS, travelProgress, type Location } from '#/lib/bounty.ts'

/**
 * Where the hunter is on their way to the bounty: "Traveling to <Area>" with a countdown and bar,
 * then "On site". Derived from claimed_at, the same way the Roblox map walks its marker.
 */
export function TravelStatus({ claimedAt, location }: { claimedAt: string | null; location: Location }) {
  const [now, setNow] = useState(() => Date.now())
  const progress = travelProgress(claimedAt, now)
  const arrived = progress >= 1

  // Tick only while travelling; an arrived hunter costs nothing.
  useEffect(() => {
    if (arrived) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [arrived])

  const area = LOCATION_LABELS[location]

  if (arrived) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint">
        <MapPin aria-hidden="true" className="size-4" /> On site at {area}
      </span>
    )
  }

  const secondsLeft = Math.max(1, Math.ceil(HUNT_TRAVEL_SECONDS * (1 - progress)))
  return (
    <div className="flex flex-col gap-1.5" role="status">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-copper" suppressHydrationWarning>
        <Footprints aria-hidden="true" className="size-4" /> Traveling to {area} · {secondsLeft}s
      </span>
      <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
        <div
          className="h-full rounded-full bg-copper transition-[width] duration-200"
          style={{ width: `${Math.round(progress * 100)}%` }}
          suppressHydrationWarning
        />
      </div>
    </div>
  )
}
