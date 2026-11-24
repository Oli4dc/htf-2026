import { useEffect, useRef, useState } from 'react'
import { MagicOrb } from '#/components/MagicOrb.tsx'

// Danger is the share of fugitives still on the loose (100 - level).
function dangerState(danger: number) {
  if (danger <= 0) return 'Safe: the prisoners are bored. Mission accomplished.'
  if (danger < 25) return 'Low: just one or two stragglers. Someone check under the bridge.'
  if (danger < 50) return 'Moderate: keep your cloak on and your wand nearby.'
  if (danger < 75) return 'High: wanted posters are running out of wall space.'
  return 'Extreme: the criminals have started a book club. In your house.'
}

/** Counts towards the new value instead of jumping. */
function useAnimatedNumber(target: number, durationMs = 900) {
  const [value, setValue] = useState(target)
  const current = useRef(target)

  useEffect(() => {
    const from = current.current
    if (from === target) return
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / durationMs)
      const next = Math.round(from + (target - from) * (1 - (1 - t) ** 3))
      current.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}

export function MagicPanel({
  level,
  captured,
  total,
}: {
  level: number
  captured: number
  total: number
}) {
  // `level` is the share captured; the orb heals as it rises, while the
  // danger shown to guardians is the inverse: how many are still out there.
  const danger = 100 - level
  const shown = useAnimatedNumber(danger)
  const dangerColor = danger > 75 ? 'text-red-400' : danger >= 50 ? 'text-amber-300' : 'text-mint'

  return (
    <section
      role="meter"
      aria-label="Danger level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={danger}
      aria-valuetext={`${danger}%, ${captured} of ${total} fugitives captured`}
      className="flex items-center gap-5 rounded-2xl border border-line bg-panel p-5 sm:gap-8 sm:p-7"
    >
      <MagicOrb level={level} className="w-28 shrink-0 sm:w-40 lg:w-36 xl:w-44" />
      <div className="min-w-0">
        <h2 className="font-heading text-4xl leading-none text-fg sm:text-5xl">Danger level</h2>
        <p
          className={`mt-1 text-6xl leading-none font-bold tabular-nums transition-colors duration-1000 sm:text-7xl lg:text-6xl xl:text-7xl ${dangerColor}`}
        >
          {shown}
          <span className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl">%</span>
        </p>
        <p className="mt-2 text-base font-medium text-fg">
          {total === 0 ? 'Nobody has escaped' : `${captured}/${total} captured`}
        </p>
        <p className="text-base text-muted">{dangerState(danger)}</p>
      </div>
    </section>
  )
}
