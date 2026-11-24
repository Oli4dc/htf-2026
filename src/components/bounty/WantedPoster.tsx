import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Crosshair, MapPin, MessageSquare } from 'lucide-react'
import { StatusPill } from '#/components/StatusBadge.tsx'
import { Shards } from '#/components/bounty/Shards.tsx'
import { ThreatMeter } from '#/components/bounty/ThreatMeter.tsx'
import { TravelStatus } from '#/components/bounty/TravelStatus.tsx'
import { TimeAgo } from '#/components/ui/TimeAgo.tsx'
import { FINAL_STATUS, LOCATION_LABELS, type Bounty } from '#/lib/bounty.ts'
import { formatGlitchId } from '#/lib/glitch.ts'

/** A "wanted" poster for one bounty. `children` is the action row. */
export function WantedPoster({
  bounty,
  isMine = false,
  large = false,
  children,
}: {
  bounty: Bounty
  /** Claimed by the viewer: gets a highlighted border. */
  isMine?: boolean
  /** Detail page version: bigger title, no link on the name. */
  large?: boolean
  children?: ReactNode
}) {
  const resolved = bounty.status === FINAL_STATUS
  const fugitive = bounty.kind === 'FUGITIVE'

  const title = (
    <span className={`font-heading leading-none text-fg ${large ? 'text-5xl sm:text-6xl' : 'text-3xl'}`}>
      {bounty.targetName}
    </span>
  )

  return (
    <article
      className={`relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border bg-panel p-5 shadow-lg shadow-black/20 ${
        isMine ? 'border-copper ring-1 ring-copper/50' : fugitive ? 'border-red-400/50' : 'border-line'
      } ${resolved ? 'opacity-70' : ''}`}
    >
      {fugitive && (
        <div className="-mx-5 -mt-5 mb-1 bg-[repeating-linear-gradient(-45deg,#7a0014_0_14px,#a3122c_14px_28px)] px-5 py-1.5 text-center text-xs font-bold tracking-[0.25em] text-white uppercase">
          Escaped from the Null Vault
        </div>
      )}

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-bold tracking-[0.35em] text-copper uppercase">
            {resolved ? 'Bounty closed' : fugitive ? 'Wanted' : 'Reported'}
          </span>
          {large ? (
            <h1>{title}</h1>
          ) : (
            <h2>
              <Link
                to="/glitches/$glitchId"
                params={{ glitchId: String(bounty.glitchId) }}
                className="hover:underline focus-visible:underline"
              >
                {title}
              </Link>
            </h2>
          )}
          <span className="font-mono text-sm text-muted">{formatGlitchId(bounty.glitchId)}</span>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold tracking-wide uppercase ${
            fugitive ? 'bg-red-500/15 text-red-300 ring-1 ring-red-400/40' : 'bg-cyan/10 text-cyan ring-1 ring-cyan/40'
          }`}
        >
          {fugitive ? 'Fugitive' : 'Anomaly'}
        </span>
      </header>

      <p className={`text-muted ${large ? 'text-lg' : 'line-clamp-3 text-base'}`}>{bounty.description}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-muted">Reward</dt>
          <dd>
            <Shards amount={bounty.reward} className="text-lg" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted">Threat</dt>
          <dd>
            <ThreatMeter threat={bounty.threat} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted">Last seen</dt>
          <dd className="inline-flex items-center gap-1.5 text-fg">
            <MapPin aria-hidden="true" className="size-4 text-mint" />
            {LOCATION_LABELS[bounty.location]}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          {/* You hunt a fugitive; an anomaly like a fire is just assigned to someone. */}
          <dt className="text-muted">{fugitive ? 'Hunter' : 'Assigned to'}</dt>
          <dd className="inline-flex items-center gap-1.5 text-fg">
            <Crosshair aria-hidden="true" className="size-4 text-copper" />
            {bounty.hunter ?? <span className="text-muted italic">Unclaimed</span>}
            {isMine && <span className="text-xs font-semibold text-copper">(you)</span>}
          </dd>
        </div>
        {bounty.hunter && !resolved && (
          <div className="col-span-2">
            <TravelStatus claimedAt={bounty.claimedAt} location={bounty.location} />
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <StatusPill status={bounty.status} kind={bounty.kind} />
        <span className="inline-flex items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1" title={`${bounty.echoCount} sightings`}>
            <MessageSquare aria-hidden="true" className="size-4" /> {bounty.echoCount}
          </span>
          <TimeAgo iso={bounty.lastSeenAt} short />
        </span>
      </div>

      {children}
    </article>
  )
}
