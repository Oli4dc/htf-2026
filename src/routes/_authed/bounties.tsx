import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronDown, Crosshair, Plus, X } from 'lucide-react'
import { BountyActions } from '#/components/bounty/BountyActions.tsx'
import { BountyCard } from '#/components/bounty/BountyCard.tsx'
import { PostBountyForm } from '#/components/bounty/PostBountyForm.tsx'
import { PrisonBreakBanner } from '#/components/bounty/PrisonBreakBanner.tsx'
import { TravelStatus } from '#/components/bounty/TravelStatus.tsx'
import { getBounties } from '#/lib/bounties.functions.ts'
import { FINAL_STATUS, activeHuntOf, type Bounty } from '#/lib/bounty.ts'
import type { Guardian } from '#/lib/guardian.ts'

export const Route = createFileRoute('/_authed/bounties')({
  loader: () => getBounties(),
  component: BountyBoardPage,
})

// Hunters get these tabs; commanders can't claim, so they just see everything (no tabs).
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Claimed by you' },
  { id: 'captured', label: 'Captured' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function matches(filter: FilterId, bounty: Bounty, guardian: Guardian) {
  const yours = bounty.claimedByGuardianId === guardian.guardianId
  const closed = bounty.status === FINAL_STATUS
  if (filter === 'mine') return yours && !closed
  if (filter === 'captured') return yours && closed
  return true
}

function BountyBoardPage() {
  const bounties = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()
  const [filter, setFilter] = useState<FilterId>('all')
  const [posting, setPosting] = useState(false)
  const isCommander = guardian.role === 'commander'

  const fugitivesAtLarge = bounties.filter(
    (b) => b.kind === 'FUGITIVE' && b.status !== FINAL_STATUS,
  ).length
  // One active bounty per hunter: shown once at the top instead of a lock on every card.
  const activeHunt = activeHuntOf(bounties, guardian.guardianId)
  const myHunt = activeHunt ? bounties.find((b) => b.glitchId === activeHunt.glitchId) : undefined

  const shown = bounties.filter((b) => matches(filter, b, guardian))
  const open = shown.filter((b) => b.status !== FINAL_STATUS)
  const closed = shown.filter((b) => b.status === FINAL_STATUS)
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, bounties.filter((b) => matches(f.id, b, guardian)).length]),
  ) as Record<FilterId, number>

  const card = (bounty: Bounty) => (
    <li key={bounty.glitchId}>
      <BountyCard bounty={bounty} isMine={bounty.claimedByGuardianId === guardian.guardianId}>
        <BountyActions bounty={bounty} guardian={guardian} activeHunt={activeHunt} compact />
      </BountyCard>
    </li>
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-4xl leading-none text-fg">Bounties</h1>
        {isCommander && (
          <button
            type="button"
            onClick={() => setPosting((p) => !p)}
            aria-expanded={posting}
            className="inline-flex items-center gap-2 rounded-xl border border-copper px-4 py-2 font-semibold text-copper transition hover:bg-copper/10"
          >
            {posting ? <X className="size-5" /> : <Plus className="size-5" />}
            {posting ? 'Close' : 'Post a bounty'}
          </button>
        )}
      </div>

      <PrisonBreakBanner atLarge={fugitivesAtLarge} />

      {myHunt && (
        <Link
          to="/glitches/$glitchId"
          params={{ glitchId: String(myHunt.glitchId) }}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-copper/60 bg-copper/10 px-4 py-3 transition hover:bg-copper/15"
        >
          <span className="inline-flex items-center gap-2 text-fg">
            <Crosshair aria-hidden="true" className="size-5 text-copper" />
            Your hunt: <span className="font-semibold">{myHunt.targetName}</span>
            <span className="text-sm text-muted">· one at a time, capture it to claim another</span>
          </span>
          <TravelStatus claimedAt={myHunt.claimedAt} location={myHunt.location} />
        </Link>
      )}

      {posting && (
        <section className="rounded-2xl border border-copper/60 bg-panel p-4 sm:p-6">
          <h2 className="mb-4 font-heading text-3xl text-fg">Post a bounty</h2>
          <PostBountyForm onDone={() => setPosting(false)} />
        </section>
      )}

      {/* Tabs for hunters only: one quiet row, the active one underlined. */}
      {!isCommander && (
        <div role="group" aria-label="Filter bounties" className="flex gap-1 overflow-x-auto border-b border-line">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'border-cyan text-fg'
                  : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              {f.label} <span className="text-muted tabular-nums">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      )}

      {filter === 'captured' ? (
        // Your trophies: shown open, not folded away.
        closed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted">
            Nothing captured yet. Close a hunt to see it here.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{closed.map(card)}</ul>
        )
      ) : open.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted">
          {filter === 'mine'
            ? 'No open hunt. Claim one from All.'
            : 'No open bounties here. Achrona is quiet, for now.'}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{open.map(card)}</ul>
      )}

      {filter === 'all' && closed.length > 0 && (
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
            <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
            Closed ({closed.length})
          </summary>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{closed.map(card)}</ul>
        </details>
      )}
    </div>
  )
}
