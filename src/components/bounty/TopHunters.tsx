import { Link } from '@tanstack/react-router'
import { ChevronRight, Crown } from 'lucide-react'
import { Shards } from '#/components/bounty/Shards.tsx'
import type { HunterRow } from '#/lib/bounty.ts'

// Gold, silver, bronze for the rank number.
const medal: Record<number, string> = {
  1: 'text-yellow-300',
  2: 'text-slate-200',
  3: 'text-orange-300',
}

/** Dashboard summary of the leaderboard: the top hunters, with you marked. */
export function TopHunters({
  hunters,
  guardianId,
  limit = 5,
}: {
  hunters: HunterRow[]
  guardianId: number
  limit?: number
}) {
  const top = hunters.slice(0, limit)
  const me = hunters.find((h) => h.guardianId === guardianId)
  // Show your own row too when you are below the cut.
  const extra = me && !top.includes(me) ? me : null

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-3xl leading-none text-fg">Top hunters</h2>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-0.5 text-sm text-muted transition-colors hover:text-fg"
        >
          All <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </header>

      {top.length === 0 ? (
        <p className="text-sm text-muted">No hunters yet.</p>
      ) : (
        <ol className="flex flex-col">
          {[...top, ...(extra ? [extra] : [])].map((hunter, i) => {
            const isMe = hunter.guardianId === guardianId
            return (
              <li
                key={hunter.guardianId}
                aria-current={isMe ? 'true' : undefined}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 ${
                  isMe ? 'bg-copper/10 ring-1 ring-copper/50' : ''
                } ${extra === hunter && i > 0 ? 'mt-2' : ''}`}
              >
                <span
                  className={`inline-flex w-7 shrink-0 justify-center font-bold tabular-nums ${
                    medal[hunter.rank] ?? 'text-muted'
                  }`}
                >
                  {hunter.rank === 1 ? (
                    <Crown aria-label="Rank 1" className="size-5" />
                  ) : (
                    hunter.rank
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">
                    {hunter.codename}
                    {isMe && <span className="ml-1.5 text-xs font-bold text-copper uppercase">You</span>}
                  </span>
                  <span className="block text-xs text-muted">
                    {hunter.title} · {hunter.captured} captured · {hunter.fixed} fixed
                  </span>
                </span>
                <Shards amount={hunter.shards} className="text-sm" />
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
