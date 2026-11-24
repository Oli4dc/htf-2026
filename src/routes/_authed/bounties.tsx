import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { BountyActions } from '#/components/bounty/BountyActions.tsx'
import { PostBountyForm } from '#/components/bounty/PostBountyForm.tsx'
import { PrisonBreakBanner } from '#/components/bounty/PrisonBreakBanner.tsx'
import { WantedPoster } from '#/components/bounty/WantedPoster.tsx'
import { getBounties } from '#/lib/bounties.functions.ts'
import { FINAL_STATUS, type Bounty } from '#/lib/bounty.ts'
import type { Guardian } from '#/lib/guardian.ts'

export const Route = createFileRoute('/_authed/bounties')({
  loader: () => getBounties(),
  component: BountyBoardPage,
})

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unclaimed', label: 'Unclaimed' },
  { id: 'mine', label: 'Mine' },
  { id: 'fugitives', label: 'Fugitives' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function matches(filter: FilterId, bounty: Bounty, guardian: Guardian) {
  switch (filter) {
    case 'unclaimed':
      return bounty.claimedByGuardianId === null && bounty.status !== FINAL_STATUS
    case 'mine':
      return bounty.claimedByGuardianId === guardian.guardianId
    case 'fugitives':
      return bounty.kind === 'FUGITIVE'
    default:
      return true
  }
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
  const open = bounties.filter((b) => b.status !== FINAL_STATUS).length
  const shown = bounties.filter((b) => matches(filter, b, guardian))
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, bounties.filter((b) => matches(f.id, b, guardian)).length]),
  ) as Record<FilterId, number>

  return (
    <div className="flex flex-col gap-6">
      <PrisonBreakBanner atLarge={fugitivesAtLarge} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl leading-none text-fg sm:text-5xl">Bounty board</h1>
          <p className="mt-1 text-muted">
            {open} open {open === 1 ? 'bounty' : 'bounties'}.{' '}
            {isCommander
              ? 'Post bounties and assign hunters from a bounty page.'
              : 'Claim one, hunt it down, collect the shards.'}
          </p>
        </div>
        {isCommander && (
          <button
            type="button"
            onClick={() => setPosting((p) => !p)}
            aria-expanded={posting}
            className="inline-flex items-center gap-2 rounded-xl border border-copper px-4 py-2.5 font-semibold text-copper transition hover:bg-copper/10"
          >
            {posting ? <X className="size-5" /> : <Plus className="size-5" />}
            {posting ? 'Close' : 'Post a bounty'}
          </button>
        )}
      </div>

      {posting && (
        <section className="rounded-2xl border border-copper/60 bg-panel p-4 sm:p-6">
          <h2 className="mb-4 font-heading text-3xl text-fg">Post a bounty</h2>
          <PostBountyForm onDone={() => setPosting(false)} />
        </section>
      )}

      <div role="group" aria-label="Filter bounties" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.id
                ? 'border-cyan bg-cyan/15 text-cyan'
                : 'border-line text-muted hover:bg-subtle hover:text-fg'
            }`}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-lg text-muted">
          {filter === 'mine'
            ? isCommander
              ? 'Commanders do not hunt. Assign bounties to defenders instead.'
              : 'You have not claimed a bounty yet. Pick one from Unclaimed.'
            : 'No bounties here. Achrona is quiet, for now.'}
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((bounty) => (
            <li key={bounty.glitchId}>
              <WantedPoster
                bounty={bounty}
                isMine={bounty.claimedByGuardianId === guardian.guardianId}
              >
                <BountyActions bounty={bounty} guardian={guardian} />
              </WantedPoster>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
