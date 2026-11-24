import { Link } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { GlitchActions } from '#/components/GlitchActions.tsx'
import { StatusPill } from '#/components/StatusBadge.tsx'
import { TimeAgo } from '#/components/ui/TimeAgo.tsx'
import { formatGlitchId, type GlitchSummary } from '#/lib/glitch.ts'

/** Flat glitch rows of the dashboard. Commanders also get status and delete controls. */
export function GlitchesTable({
  glitches,
  isCommander,
}: {
  glitches: GlitchSummary[]
  isCommander: boolean
}) {
  if (glitches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-lg text-muted">
        All quiet in Achrona. No glitches on record.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {glitches.map((glitch) => (
        <li
          key={glitch.glitchId}
          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-app/40 px-4 py-3 transition-colors hover:bg-subtle sm:flex-row sm:items-center sm:gap-5"
        >
          <Link
            to="/glitches/$glitchId"
            params={{ glitchId: String(glitch.glitchId) }}
            className="flex min-w-0 flex-1 flex-col gap-0.5"
          >
            <span className="text-xl font-semibold text-fg">{formatGlitchId(glitch.glitchId)}</span>
            <span className="text-base text-muted">{glitch.description}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:justify-end">
            <span
              className="inline-flex items-center gap-1.5 text-base text-muted"
              title={`${glitch.echoCount} echoes`}
            >
              <MessageSquare className="size-4" />
              {glitch.echoCount}
            </span>
            <TimeAgo
              iso={glitch.timestamp}
              short
              className="text-base whitespace-nowrap text-muted sm:w-20 sm:text-right"
            />
            <StatusPill status={glitch.status} />
            {isCommander && <GlitchActions glitchId={glitch.glitchId} status={glitch.status} />}
          </div>
        </li>
      ))}
    </ul>
  )
}
