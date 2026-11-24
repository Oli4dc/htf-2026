// Crack lines in a 100x100 box, one group per damage tier.
const CRACKS: { below: number; paths: string[] }[] = [
  {
    below: 75,
    paths: [
      'M30 6 L38 22 L33 36 L46 50 L42 63 L55 78 L52 95',
      'M46 50 L60 44 L68 32',
    ],
  },
  {
    below: 50,
    paths: [
      'M94 38 L80 44 L72 58 L60 62 L55 78',
      'M33 36 L18 42 L6 56',
      'M72 58 L82 72 L78 88',
    ],
  },
  {
    below: 25,
    paths: [
      'M60 4 L62 20 L68 32 L84 26',
      'M42 63 L26 70 L20 86',
      'M18 42 L14 26',
      'M60 62 L66 80',
      'M38 22 L52 16',
    ],
  },
]

/** The magic orb: dims, cracks and flickers as the level (0-100) drops. */
export function MagicOrb({ level, className = '' }: { level: number; className?: string }) {
  const ratio = Math.max(0, Math.min(100, level)) / 100
  const brightness = 0.45 + 0.6 * ratio
  const saturation = 0.25 + 0.8 * ratio
  const glowSize = 8 + 44 * ratio
  const glowAlpha = 0.12 + 0.55 * ratio

  return (
    <div className={`orb-pulse aspect-square ${className}`} aria-hidden="true">
      <div
        className={`relative size-full overflow-hidden rounded-full transition-[filter,box-shadow] duration-1000 ease-out ${
          level < 25 ? 'orb-flicker' : ''
        }`}
        style={{
          filter: `brightness(${brightness}) saturate(${saturation})`,
          boxShadow: `0 0 ${glowSize}px ${glowSize / 4}px rgb(111 224 200 / ${glowAlpha})`,
        }}
      >
        {/* The picture has a dark square around the orb; zoom in so the circle crops it away. */}
        <img
          src="/orb.png"
          alt=""
          draggable={false}
          className="size-full scale-[1.5] object-cover select-none"
        />
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" fill="none">
          {CRACKS.map((tier) => (
            <g
              key={tier.below}
              className="transition-opacity duration-1000"
              style={{ opacity: level < tier.below ? 1 : 0 }}
            >
              {tier.paths.map((d) => (
                <g key={d} strokeLinecap="round" strokeLinejoin="round">
                  {/* Dark gap with a bright edge, so cracks read on light and dim orbs. */}
                  <path d={d} stroke="#0b0a1c" strokeWidth="2.2" />
                  <path d={d} stroke="#d9fff6" strokeWidth="0.7" />
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
