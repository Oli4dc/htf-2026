type MagicGaugeProps = {
  /** Magic level in Achrona, 0–100. Out-of-range values are clamped. */
  level: number
  className?: string
}

// Half circle from the left end to the right end, centred at (100, 100) with radius 90.
const ARC = 'M 10 100 A 90 90 0 0 1 190 100'

function levelMeta(level: number) {
  if (level > 70) return { stroke: 'stroke-emerald-500', text: 'text-emerald-600', label: 'Stable' }
  if (level >= 40) return { stroke: 'stroke-amber-500', text: 'text-amber-600', label: 'Weakening' }
  return { stroke: 'stroke-red-500', text: 'text-red-600', label: 'Critical' }
}

export function MagicGauge({ level, className = '' }: MagicGaugeProps) {
  const value = Math.round(Math.max(0, Math.min(100, Number.isFinite(level) ? level : 0)))
  const meta = levelMeta(value)

  return (
    <div
      role="meter"
      aria-label="Magic in Achrona"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%, ${meta.label.toLowerCase()}`}
      className={`relative mx-auto w-full max-w-xs ${className}`}
    >
      <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
        <path d={ARC} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-line" />
        {/* pathLength=100 makes the dash offset equal to "percent not filled". */}
        <path
          d={ARC}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={100 - value}
          // At 0 the round cap would still show a dot, so hide the arc entirely.
          opacity={value === 0 ? 0 : 1}
          className={`${meta.stroke} transition-[stroke-dashoffset,stroke] duration-700 ease-out motion-reduce:transition-none`}
        />
      </svg>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-4xl font-semibold tabular-nums text-fg sm:text-5xl">{value}%</span>
        <span className="mt-1 text-sm text-muted">Magic in Achrona</span>
        <span className={`text-xs font-medium uppercase tracking-wide transition-colors duration-700 ${meta.text}`}>
          {meta.label}
        </span>
      </div>
    </div>
  )
}
