import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Crosshair, MapPin } from 'lucide-react'
import { StatusBadge } from '#/components/StatusBadge.tsx'
import { Shards } from '#/components/bounty/Shards.tsx'
import { ThreatMeter } from '#/components/bounty/ThreatMeter.tsx'
import { TravelStatus } from '#/components/bounty/TravelStatus.tsx'
import { FINAL_STATUS, LOCATION_LABELS, type Bounty } from '#/lib/bounty.ts'

/**
 * Compact bounty for the board: name, status, one line of facts, the hunter and
 * at most one action. Everything else (description, sightings) is on the bounty page,
 * and the whole card links there.
 */
export function BountyCard({
  bounty,
  isMine = false,
  children,
}: {
  bounty: Bounty
  /** Claimed by the viewer: gets a copper edge. */
  isMine?: boolean
  /** The action, if any. */
  children?: ReactNode
}) {
  const resolved = bounty.status === FINAL_STATUS
  const fugitive = bounty.kind === 'FUGITIVE'

  return (
    <article
      className={`relative flex h-full flex-col gap-3 rounded-2xl border bg-panel p-4 transition-colors hover:bg-card-strong ${
        isMine ? 'border-copper/70' : 'border-line'
      } ${resolved ? 'opacity-60' : ''}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {fugitive && (
            <span className="text-xs font-semibold tracking-wide text-red-300 uppercase">
              Fugitive
            </span>
          )}
          <h2 className="font-heading text-2xl leading-tight text-fg">
            {/* Stretched link: the whole card opens the bounty. */}
            <Link
              to="/glitches/$glitchId"
              params={{ glitchId: String(bounty.glitchId) }}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-cyan"
            >
              {bounty.targetName}
            </Link>
          </h2>
        </div>
        <StatusBadge status={bounty.status} />
      </header>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <ThreatMeter threat={bounty.threat} size="size-3.5" />
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" className="size-3.5" />
          {LOCATION_LABELS[bounty.location]}
        </span>
        <Shards amount={bounty.reward} />
      </p>

      {bounty.hunter && (
        <div className="text-sm">
          {resolved ? (
            <span className="text-muted">Captured by {bounty.hunter}</span>
          ) : isMine ? (
            <TravelStatus claimedAt={bounty.claimedAt} location={bounty.location} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Crosshair aria-hidden="true" className="size-3.5" /> Hunted by {bounty.hunter}
            </span>
          )}
        </div>
      )}

      {/* Above the stretched link, so the button stays clickable. */}
      {children && <div className="relative z-10 mt-auto pt-1">{children}</div>}
    </article>
  )
}
