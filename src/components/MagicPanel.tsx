import { useEffect, useRef, useState } from 'react'
import { MagicOrb } from '#/components/MagicOrb.tsx'

function magicState(level: number) {
  if (level >= 75) return 'The grid is stable'
  if (level >= 50) return 'The Desync is spreading'
  if (level >= 25) return 'Achrona is cracking'
  return 'Critical: magic is failing'
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

export function MagicPanel({ level }: { level: number }) {
  const shown = useAnimatedNumber(level)
  const critical = level < 25

  return (
    <section
      role="meter"
      aria-label="Magic in Achrona"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={level}
      className="flex items-center gap-5 rounded-2xl border border-line bg-panel p-5 sm:gap-8 sm:p-7"
    >
      <MagicOrb level={level} className="w-28 shrink-0 sm:w-40 lg:w-36 xl:w-44" />
      <div className="min-w-0">
        <h2 className="font-heading text-4xl leading-none text-fg sm:text-5xl">Magic</h2>
        <p
          className={`mt-1 text-6xl leading-none font-bold tabular-nums transition-colors duration-1000 sm:text-7xl lg:text-6xl xl:text-7xl ${
            critical ? 'text-red-400' : 'text-mint'
          }`}
        >
          {shown}
          <span className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl">%</span>
        </p>
        <p className="mt-2 text-base text-muted">{magicState(level)}</p>
      </div>
    </section>
  )
}
