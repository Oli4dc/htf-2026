import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Dices } from 'lucide-react'
import { Shards } from '#/components/bounty/Shards.tsx'
import { getRoulette, spinRoulette } from '#/lib/roulette.functions.ts'
import {
  MAX_WAGER,
  WHEEL_ORDER,
  betLabel,
  colorOf,
  type PocketColor,
  type RouletteBet,
  type Spin,
} from '#/lib/roulette.ts'
import { pauseLiveUpdates } from '#/lib/useLiveUpdates.ts'

export const Route = createFileRoute('/_authed/roulette')({
  loader: () => getRoulette(),
  component: RoulettePage,
})

const SPIN_MS = 4500
const SEGMENT = 360 / WHEEL_ORDER.length

const pocketFill: Record<PocketColor, string> = {
  red: '#b3122e',
  black: '#17142a',
  green: '#138a4a',
}

function winLine(spin: Spin) {
  const net = spin.payout - spin.wager
  if (net <= 0) {
    const lines = [
      'The house thanks you for your donation.',
      'Those shards are in a better place now.',
      'Even The Desync feels bad for you.',
      'Have you tried hunting instead?',
    ]
    return lines[spin.spinId % lines.length]
  }
  if (spin.payout >= spin.wager * 36) return 'JACKPOT! The High Council demands an audit.'
  return 'Winner! Do not tell the commander.'
}

function RoulettePage() {
  const { balance: loadedBalance, spins } = Route.useLoaderData()
  const router = useRouter()
  const spin = useServerFn(spinRoulette)

  const [bet, setBet] = useState<RouletteBet>('red')
  const [wagerText, setWagerText] = useState('50')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [last, setLast] = useState<Spin | null>(null)
  // While the wheel turns, keep showing the balance from before the spin.
  const [shownBalance, setShownBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const balance = shownBalance ?? loadedBalance
  const wager = Number(wagerText)
  const validWager = Number.isInteger(wager) && wager >= 1 && wager <= Math.min(balance, MAX_WAGER)

  async function handleSpin() {
    setError(null)
    setLast(null)
    setSpinning(true)
    setShownBalance(balance - wager)
    pauseLiveUpdates(SPIN_MS + 1000)
    try {
      const result = await spin({ data: { bet, wager } })
      // Land the drawn pocket under the pointer, after a few full turns.
      const index = WHEEL_ORDER.indexOf(result.result as (typeof WHEEL_ORDER)[number])
      // Pocket i is centred at i * SEGMENT degrees (see <Wheel />).
      const target = -(index * SEGMENT)
      setRotation((current) => {
        const offset = (((target - current) % 360) + 360) % 360
        return current + 6 * 360 + offset
      })
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setTimeout(
        async () => {
          setLast(result)
          setSpinning(false)
          await router.invalidate()
          setShownBalance(null)
        },
        reduceMotion ? 300 : SPIN_MS,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The wheel jammed. Try again.')
      setSpinning(false)
      setShownBalance(null)
    }
  }

  const numberBet = /^\d+$/.test(bet) ? bet : ''

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl leading-none text-fg sm:text-5xl">
            The Shard Roulette
          </h1>
          <p className="mt-1 text-muted">
            Hard-earned bounty shards, gone in one spin. The leaderboard only counts what you
            earned, so your reputation is safe. Your shards are not.
          </p>
        </div>
        <div className="rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2 text-xl" aria-live="polite">
          <Shards amount={balance} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* The wheel */}
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel p-4 sm:p-6">
          <div className="relative w-full max-w-sm">
            {/* Fixed pointer at the top */}
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="absolute -top-1 left-1/2 z-10 size-7 -translate-x-1/2 drop-shadow-[0_2px_4px_rgb(0_0_0/0.6)]"
            >
              <path d="M10 18 L2 2 L18 2 Z" fill="#facc15" stroke="#111" strokeWidth="1" />
            </svg>
            <div
              className="aspect-square w-full rounded-full shadow-[0_0_40px_rgb(53_214_230/0.25)] motion-reduce:transition-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.7, 0.1, 1)`,
              }}
            >
              <Wheel />
            </div>
          </div>

          <div className="min-h-16 text-center" aria-live="polite">
            {spinning && <p className="text-lg text-muted">No more bets…</p>}
            {last && !spinning && (
              <>
                <p className="text-2xl font-bold text-fg">
                  <span
                    className="mr-2 inline-flex size-10 items-center justify-center rounded-full text-white"
                    style={{ background: pocketFill[colorOf(last.result)] }}
                  >
                    {last.result}
                  </span>
                  {last.payout > 0 ? (
                    <span className="text-mint">+{last.payout - last.wager} shards</span>
                  ) : (
                    <span className="text-red-400">−{last.wager} shards</span>
                  )}
                </p>
                <p className="mt-1 text-muted">{winLine(last)}</p>
              </>
            )}
          </div>
        </section>

        {/* Betting */}
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-4 sm:p-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-muted">Bet on a colour</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['red', 'black', 'green'] as const).map((colour) => (
                <button
                  key={colour}
                  type="button"
                  aria-pressed={bet === colour}
                  disabled={spinning}
                  onClick={() => setBet(colour)}
                  className={`rounded-xl px-3 py-3 font-bold text-white transition ${
                    bet === colour ? 'ring-4 ring-yellow-300' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ background: pocketFill[colour] }}
                >
                  {colour === 'green' ? 'Green 0' : colour[0].toUpperCase() + colour.slice(1)}
                  <span className="block text-xs font-medium opacity-80">
                    pays {colour === 'green' ? '36×' : '2×'}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
            …or one number (pays 36×)
            <select
              value={numberBet}
              disabled={spinning}
              onChange={(e) => setBet((e.target.value || 'red') as RouletteBet)}
              className="rounded-xl border border-line bg-app/60 px-3 py-2.5 text-base text-fg focus:border-accent focus:outline-none"
            >
              <option value="">No number</option>
              {Array.from({ length: 37 }, (_, n) => (
                <option key={n} value={String(n)}>
                  {n} ({colorOf(n)})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <label htmlFor="wager" className="text-sm font-medium text-muted">
              Wager
            </label>
            <input
              id="wager"
              type="number"
              min={1}
              max={Math.min(balance, MAX_WAGER)}
              value={wagerText}
              disabled={spinning}
              onChange={(e) => setWagerText(e.target.value)}
              className="rounded-xl border border-line bg-app/60 px-3 py-2.5 text-lg text-fg tabular-nums focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {[10, 50, 100, 250].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={spinning}
                  onClick={() => setWagerText(String(chip))}
                  className="rounded-full border border-line px-3 py-1 text-sm text-fg hover:bg-subtle"
                >
                  {chip}
                </button>
              ))}
              <button
                type="button"
                disabled={spinning || balance < 1}
                onClick={() => setWagerText(String(Math.min(balance, MAX_WAGER)))}
                className="rounded-full border border-red-400/60 px-3 py-1 text-sm font-semibold text-red-300 hover:bg-red-500/15"
              >
                All in
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || !validWager}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-6 py-4 text-xl font-bold text-copper-ink shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices className="size-6" />
            {spinning ? 'Spinning…' : `Spin: ${betLabel(bet)} for ${validWager ? wager : '?'}`}
          </button>

          <p role={error ? 'alert' : undefined} className={`text-sm ${error ? 'text-red-300' : 'text-muted'}`}>
            {error ??
              (balance < 1
                ? 'You are broke. Close a bounty to earn shards.'
                : !validWager
                  ? `Bet between 1 and ${Math.min(balance, MAX_WAGER)} shards.`
                  : 'The ball is drawn by the server. No cheating, guardian.')}
          </p>
        </section>
      </div>

      {spins.length > 0 && (
        <section className="rounded-2xl border border-line bg-panel p-4 sm:p-6">
          <h2 className="mb-3 font-semibold text-fg">Your last spins</h2>
          <ul className="flex flex-col divide-y divide-white/10">
            {spins.map((s) => (
              <li key={s.spinId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2 text-fg">
                  <span
                    className="inline-flex size-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: pocketFill[colorOf(s.result)] }}
                  >
                    {s.result}
                  </span>
                  {betLabel(s.bet)} · {s.wager}
                </span>
                <span className={`font-semibold tabular-nums ${s.payout > 0 ? 'text-mint' : 'text-red-400'}`}>
                  {s.payout > 0 ? `+${s.payout - s.wager}` : `−${s.wager}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** The 37 pockets, drawn once. Pocket 0 is centred at the top. */
function Wheel() {
  const r = 100
  const inner = 62
  const point = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return `${(radius * Math.cos(rad)).toFixed(2)} ${(radius * Math.sin(rad)).toFixed(2)}`
  }

  return (
    <svg viewBox="-105 -105 210 210" role="img" aria-label="Roulette wheel" className="size-full">
      <circle r="104" fill="#3b2a12" stroke="#c9713f" strokeWidth="2" />
      {WHEEL_ORDER.map((n, i) => {
        const start = i * SEGMENT - SEGMENT / 2
        const end = start + SEGMENT
        const mid = i * SEGMENT
        return (
          <g key={n}>
            <path
              d={`M ${point(start, inner)} L ${point(start, r)} A ${r} ${r} 0 0 1 ${point(end, r)} L ${point(end, inner)} A ${inner} ${inner} 0 0 0 ${point(start, inner)} Z`}
              fill={pocketFill[colorOf(n)]}
              stroke="#c9a14a"
              strokeWidth="0.6"
            />
            <text
              transform={`rotate(${mid}) translate(0 -88)`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontWeight="700"
              fill="#fff"
            >
              {n}
            </text>
          </g>
        )
      })}
      <circle r={inner} fill="#2b2a45" stroke="#c9a14a" strokeWidth="1.5" />
      <circle r="40" fill="none" stroke="rgb(53 214 230 / .5)" strokeWidth="1" />
      <path d="M0 -36 L8 0 L0 36 L-8 0 Z" fill="#c9a14a" opacity=".85" />
      <circle r="10" fill="#6fe0c8" />
    </svg>
  )
}
