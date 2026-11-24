import { createFileRoute } from '@tanstack/react-router'
import { Crown, Medal } from 'lucide-react'
import { Shards } from '#/components/bounty/Shards.tsx'
import { ThreatMeter } from '#/components/bounty/ThreatMeter.tsx'
import { getLeaderboard } from '#/lib/bounties.functions.ts'
import { RANKS, type HunterRow } from '#/lib/bounty.ts'

export const Route = createFileRoute('/_authed/leaderboard')({
  loader: () => getLeaderboard(),
  component: LeaderboardPage,
})

// Gold, silver, bronze for the top three.
const podium: Record<number, { ring: string; text: string; label: string }> = {
  1: { ring: 'border-yellow-300/70 bg-yellow-300/10', text: 'text-yellow-300', label: 'Gold' },
  2: { ring: 'border-slate-300/60 bg-slate-300/10', text: 'text-slate-200', label: 'Silver' },
  3: { ring: 'border-orange-400/60 bg-orange-400/10', text: 'text-orange-300', label: 'Bronze' },
}

function LeaderboardPage() {
  const hunters = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-4xl leading-none text-fg sm:text-5xl">Strongest hunters</h1>
        <p className="mt-1 text-muted">
          Shards come from closed bounties: the reward goes to the hunter who claimed it.
        </p>
      </div>

      {hunters.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-lg text-muted">
          No hunters yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Hunters ranked by shards">
          {hunters.map((hunter) => (
            <HunterItem
              key={hunter.guardianId}
              hunter={hunter}
              isYou={hunter.guardianId === guardian.guardianId}
            />
          ))}
        </ol>
      )}

      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 className="font-semibold text-fg">Rank titles</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {[...RANKS].reverse().map((rank) => (
            <li key={rank.title}>
              <span className="font-semibold text-fg">{rank.title}</span> from {rank.minShards} shards
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function HunterItem({ hunter, isYou }: { hunter: HunterRow; isYou: boolean }) {
  const medal = podium[hunter.rank]
  const RankIcon = hunter.rank === 1 ? Crown : Medal

  return (
    <li
      aria-current={isYou ? 'true' : undefined}
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border px-4 py-3 sm:flex-nowrap sm:px-5 ${
        medal ? medal.ring : 'border-line bg-panel'
      } ${isYou ? 'ring-2 ring-copper' : ''}`}
    >
      <span
        className={`flex w-12 shrink-0 items-center justify-center gap-1 text-2xl font-bold tabular-nums ${
          medal ? medal.text : 'text-muted'
        }`}
      >
        {medal ? <RankIcon aria-label={`${medal.label}, rank ${hunter.rank}`} className="size-7" /> : `#${hunter.rank}`}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-xl font-semibold text-fg">
          {hunter.codename}
          {isYou && (
            <span className="rounded-md bg-copper px-2 py-0.5 text-xs font-bold text-copper-ink uppercase">
              You
            </span>
          )}
        </span>
        <span className="text-sm text-muted">{hunter.title}</span>
      </div>

      <dl className="flex w-full items-center justify-between gap-5 text-sm sm:w-auto sm:justify-end">
        <div className="flex flex-col items-start sm:items-end">
          <dt className="text-muted">Captures</dt>
          <dd className="text-lg font-semibold tabular-nums text-fg">{hunter.captures}</dd>
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <dt className="text-muted">Top threat</dt>
          <dd className="h-7 content-center">
            {hunter.topThreat > 0 ? <ThreatMeter threat={hunter.topThreat} size="size-3.5" /> : <span className="text-muted">None yet</span>}
          </dd>
        </div>
        <div className="flex min-w-28 flex-col items-end">
          <dt className="text-muted">Total</dt>
          <dd>
            <Shards amount={hunter.shards} className="text-lg" />
          </dd>
        </div>
      </dl>
    </li>
  )
}
