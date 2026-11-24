import { useEffect, useRef, useState } from 'react'
import { Siren, Volume2, VolumeX } from 'lucide-react'
import { playAlarm } from '#/lib/alarmSound.ts'
import { formatGlitchId } from '#/lib/glitch.ts'

// Keyframes live here so the alarm is self-contained.
// Flashing stays at 1 per second, well under the 3-per-second photosensitivity limit.
const ALARM_CSS = `
@keyframes alarm-flash { 0%, 100% { opacity: .55 } 50% { opacity: .9 } }
@keyframes alarm-spin { to { transform: rotate(1turn) } }
@keyframes alarm-stripes { to { background-position: 56px 0 } }
@keyframes alarm-shake {
  0%, 100% { transform: translateX(0) }
  20% { transform: translateX(-4px) rotate(-1deg) }
  40% { transform: translateX(4px) rotate(1deg) }
  60% { transform: translateX(-3px) }
  80% { transform: translateX(3px) }
}
@keyframes alarm-in { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: none } }
.alarm-flash { animation: alarm-flash 1s ease-in-out infinite }
.alarm-spin { animation: alarm-spin 2s linear infinite }
.alarm-stripes {
  background: repeating-linear-gradient(-45deg, #facc15 0 20px, #111 20px 40px);
  background-size: 56px 100%;
  animation: alarm-stripes 1s linear infinite;
}
.alarm-shake { animation: alarm-shake .5s ease-in-out 4 }
.alarm-in { animation: alarm-in .35s ease-out both }
@media (prefers-reduced-motion: reduce) {
  .alarm-flash, .alarm-spin, .alarm-stripes, .alarm-shake, .alarm-in { animation: none }
}
`

/** Full-screen prison-break alarm with a siren. Closes with the button or Escape. */
export function CriminalAlarm({
  glitchId,
  description,
  onClose,
}: {
  glitchId: number
  description: string
  onClose: () => void
}) {
  const [muted, setMuted] = useState(false)
  const stopSound = useRef<() => void>(() => {})
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    stopSound.current = playAlarm()
    button.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      stopSound.current()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function toggleSound() {
    if (muted) stopSound.current = playAlarm({ seconds: 3 })
    else stopSound.current()
    setMuted(!muted)
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
      aria-describedby="alarm-description"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black p-4"
    >
      <style>{ALARM_CSS}</style>

      {/* Red wash and a rotating beacon behind everything. */}
      <div
        aria-hidden="true"
        className="alarm-flash absolute inset-0"
        style={{ background: 'radial-gradient(circle at center, #ff1f3d 0%, #7a0014 55%, #1a0006 100%)' }}
      />
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <div
          className="alarm-spin size-[220vmax] shrink-0 opacity-50"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgb(255 255 255 / .55) 18deg, transparent 40deg, transparent 180deg, rgb(255 255 255 / .55) 198deg, transparent 220deg)',
          }}
        />
      </div>
      <div aria-hidden="true" className="alarm-stripes absolute inset-x-0 top-0 h-6 sm:h-8" />
      <div aria-hidden="true" className="alarm-stripes absolute inset-x-0 bottom-0 h-6 sm:h-8" />

      <div className="alarm-in relative flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border-2 border-red-400/70 bg-black/70 px-5 py-8 text-center shadow-[0_0_80px_rgb(255_31_61/0.6)] backdrop-blur-sm sm:px-10">
        <span className="alarm-shake flex size-20 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_40px_rgb(255_60_80/0.9)]">
          <Siren className="size-11" strokeWidth={1.75} />
        </span>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold tracking-[0.4em] text-yellow-300 uppercase">
            Prison break alert
          </p>
          <h2
            id="alarm-title"
            className="alarm-shake font-heading text-5xl leading-none text-white sm:text-6xl"
          >
            A criminal is on the loose!
          </h2>
          <p className="font-mono text-lg font-semibold text-red-200">
            {formatGlitchId(glitchId)} · Escaped just now
          </p>
        </div>

        <p
          id="alarm-description"
          className="line-clamp-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white/90"
        >
          “{description}”
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            ref={button}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-copper px-6 py-4 text-xl font-bold text-copper-ink shadow-lg shadow-black/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            Start the hunt
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? 'Sound the siren again' : 'Silence the siren'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-4 font-medium text-white transition hover:bg-white/10"
          >
            {muted ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            {muted ? 'Siren' : 'Silence'}
          </button>
        </div>
      </div>
    </div>
  )
}
