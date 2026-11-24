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

/** Mint when calm, red when the danger (0-1) is high. */
function glowColor(danger: number) {
  const mix = (from: number, to: number) => Math.round(from + (to - from) * danger)
  return `${mix(111, 255)} ${mix(224, 42)} ${mix(200, 60)}`
}

/**
 * The orb: dims, cracks and flickers as the level (0-100) drops.
 * It also turns red with the danger (100 - level); from 50% danger it sounds
 * the alarm with a spinning beacon and ripples.
 */
export function MagicOrb({ level, className = '' }: { level: number; className?: string }) {
  const ratio = Math.max(0, Math.min(100, level)) / 100
  const danger = 1 - ratio
  const alarm = danger >= 0.5
  // Stays brighter than before so the red reads even on a cracked orb.
  const brightness = 0.7 + 0.35 * ratio
  const saturation = 0.6 + 0.45 * ratio
  const glowSize = alarm ? 36 : 8 + 44 * ratio
  const glowAlpha = alarm ? 0.75 : 0.12 + 0.55 * ratio
  const glow = glowColor(danger)

  return (
    <div className={`orb-pulse relative aspect-square ${className}`} aria-hidden="true">
      {/* Alarm ripples spread outward behind the orb. */}
      {alarm && (
        <>
          <span className="orb-alarm-ripple absolute inset-0 rounded-full border-4 border-red-500" />
          <span className="orb-alarm-ripple-late absolute inset-0 rounded-full border-4 border-red-500" />
        </>
      )}
      <div
        className={`relative size-full overflow-hidden rounded-full transition-[filter,box-shadow] duration-1000 ease-out ${
          level < 25 ? 'orb-flicker' : ''
        }`}
        style={{
          filter: `brightness(${brightness}) saturate(${saturation})`,
          boxShadow: `0 0 ${glowSize}px ${glowSize / 4}px rgb(${glow} / ${glowAlpha})`,
        }}
      >
        {/* The picture has a dark square around the orb; zoom in so the circle crops it away. */}
        <img
          src="/orb.png"
          alt=""
          draggable={false}
          className="size-full scale-[1.5] object-cover select-none"
        />
        {/* Red tint, stronger with more danger; it flashes during an alarm. */}
        <div
          className={`absolute inset-0 bg-[#ff2a3c] mix-blend-color transition-opacity duration-1000 ${
            alarm ? 'orb-alarm-flash' : ''
          }`}
          style={{ opacity: danger * 0.85, ['--orb-red' as string]: danger * 0.85 }}
        />
        {/* Rotating beacon light, like a police siren. */}
        {alarm && (
          <div
            className="orb-alarm-spin absolute -inset-1/4 mix-blend-screen"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgb(255 80 90 / .75) 25deg, transparent 60deg, transparent 180deg, rgb(255 80 90 / .75) 205deg, transparent 240deg)',
            }}
          />
        )}
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
