import { Link } from '@tanstack/react-router'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { GlitchActions } from '#/components/GlitchActions.tsx'
import { StatusBadge } from '#/components/StatusBadge.tsx'
import { TimeAgo, formatAbsolute } from '#/components/ui/TimeAgo.tsx'
import { formatGlitchId, type GlitchSummary } from '#/lib/glitch.ts'

const columns = ['ID', 'Description', 'Status', 'Echoes', 'Timestamp', 'Action']

export function GlitchesTable({
  glitches,
  isCommander,
}: {
  glitches: GlitchSummary[]
  isCommander: boolean
}) {
  if (glitches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
        All quiet in Achrona. No glitches on record.
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Phones: cards. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {glitches.map((glitch) => (
          <li key={glitch.glitchId}>
            <Link
              to="/glitches/$glitchId"
              params={{ glitchId: String(glitch.glitchId) }}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 transition-colors active:bg-subtle"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-medium text-accent">
                  {formatGlitchId(glitch.glitchId)}
                </span>
                <StatusBadge status={glitch.status} />
              </div>
              <p className="text-fg">{glitch.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted">
                <TimeAgo iso={glitch.timestamp} />
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-4" /> {glitch.echoCount}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet and up: the table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              {columns.map((col, i) => (
                <th
                  key={col}
                  className={`px-5 py-4 font-normal ${i === columns.length - 1 ? 'text-center' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-fg">
            {glitches.map((glitch) => (
              <tr
                key={glitch.glitchId}
                className="border-b border-line/60 transition-colors hover:bg-subtle/60"
              >
                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    to="/glitches/$glitchId"
                    params={{ glitchId: String(glitch.glitchId) }}
                    className="font-mono font-medium text-accent hover:underline"
                  >
                    {formatGlitchId(glitch.glitchId)}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    to="/glitches/$glitchId"
                    params={{ glitchId: String(glitch.glitchId) }}
                    className="hover:text-accent"
                  >
                    {glitch.description}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={glitch.status} />
                </td>
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-muted"
                    title={`${glitch.echoCount} echoes`}
                  >
                    <MessageSquare className="size-4" />
                    {glitch.echoCount}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span suppressHydrationWarning>{formatAbsolute(glitch.timestamp)}</span>
                    <TimeAgo iso={glitch.timestamp} className="text-sm text-muted" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  {isCommander ? (
                    <GlitchActions glitchId={glitch.glitchId} status={glitch.status} />
                  ) : (
                    <div className="flex justify-center">
                      <Link
                        to="/glitches/$glitchId"
                        params={{ glitchId: String(glitch.glitchId) }}
                        aria-label={`Open ${formatGlitchId(glitch.glitchId)}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-fg"
                      >
                        <ChevronRight className="size-5" />
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
