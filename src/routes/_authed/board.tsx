import { useState, type DragEvent } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { StatusBadge, statusMeta } from '#/components/StatusBadge.tsx'
import { TimeAgo } from '#/components/ui/TimeAgo.tsx'
import { getGlitches, updateGlitchStatus } from '#/lib/glitches.functions.ts'
import {
  GLITCH_STATUSES,
  formatGlitchId,
  type GlitchStatus,
  type GlitchSummary,
} from '#/lib/glitch.ts'

export const Route = createFileRoute('/_authed/board')({
  loader: () => getGlitches(),
  component: BoardPage,
})

function BoardPage() {
  const glitches = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()
  const router = useRouter()
  const updateStatus = useServerFn(updateGlitchStatus)
  const isCommander = guardian.role === 'commander'

  // Shown instantly while the server call runs; cleared after the reload.
  const [pending, setPending] = useState<Record<number, GlitchStatus>>({})
  const [dragOver, setDragOver] = useState<GlitchStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function move(glitchId: number, status: GlitchStatus) {
    setError(null)
    setPending((p) => ({ ...p, [glitchId]: status }))
    try {
      await updateStatus({ data: { glitchId, status } })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The move failed. Try again.')
    } finally {
      setPending((p) => {
        const { [glitchId]: _done, ...rest } = p
        return rest
      })
    }
  }

  function handleDrop(event: DragEvent, status: GlitchStatus) {
    event.preventDefault()
    setDragOver(null)
    const glitchId = Number(event.dataTransfer.getData('text/plain'))
    const glitch = glitches.find((g) => g.glitchId === glitchId)
    if (glitch && glitch.status !== status) move(glitchId, status)
  }

  const shown = glitches.map((g) => ({ ...g, status: pending[g.glitchId] ?? g.status }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-fg">Glitch board</h1>
        <p className="mt-1 text-muted">
          {isCommander
            ? 'Drag a glitch to another column, or use the arrows, to move it through containment.'
            : 'How every glitch is progressing. Only commanders can move them.'}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Phones: swipe sideways through the columns. */}
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {GLITCH_STATUSES.map((status) => {
          const column = shown.filter((g) => g.status === status)
          return (
            <section
              key={status}
              onDragOver={
                isCommander
                  ? (e) => {
                      e.preventDefault()
                      setDragOver(status)
                    }
                  : undefined
              }
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={isCommander ? (e) => handleDrop(e, status) : undefined}
              className={`flex w-[80vw] max-w-xs shrink-0 snap-center flex-col gap-3 rounded-2xl border p-3 transition-colors lg:w-auto lg:max-w-none ${
                dragOver === status ? 'border-accent bg-glow' : 'border-line bg-subtle'
              }`}
            >
              <header className="flex items-center justify-between px-1">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-muted">{column.length}</span>
              </header>

              <ul className="flex min-h-24 flex-col gap-3">
                {column.map((glitch) => (
                  <BoardCard
                    key={glitch.glitchId}
                    glitch={glitch}
                    canMove={isCommander}
                    busy={glitch.glitchId in pending}
                    onMove={move}
                  />
                ))}
                {column.length === 0 && (
                  <li className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                    {statusMeta[status].hint}: none
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function BoardCard({
  glitch,
  canMove,
  busy,
  onMove,
}: {
  glitch: GlitchSummary
  canMove: boolean
  busy: boolean
  onMove: (glitchId: number, status: GlitchStatus) => void
}) {
  const index = GLITCH_STATUSES.indexOf(glitch.status)
  const previous = GLITCH_STATUSES[index - 1]
  const next = GLITCH_STATUSES[index + 1]
  const arrowClass =
    'inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <li
      draggable={canMove && !busy}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(glitch.glitchId))
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={`flex flex-col gap-2 rounded-xl border border-line bg-card p-3 shadow-sm ${
        canMove ? 'cursor-grab active:cursor-grabbing' : ''
      } ${busy ? 'opacity-60' : ''}`}
    >
      <Link
        to="/glitches/$glitchId"
        params={{ glitchId: String(glitch.glitchId) }}
        draggable={false}
        className="flex flex-col gap-1"
      >
        <span className="font-mono text-sm font-medium text-accent">
          {formatGlitchId(glitch.glitchId)}
        </span>
        <span className="text-sm text-fg">{glitch.description}</span>
      </Link>

      <div className="flex items-center justify-between text-sm text-muted">
        <span className="inline-flex items-center gap-3">
          <TimeAgo iso={glitch.timestamp} />
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-4" /> {glitch.echoCount}
          </span>
        </span>

        {/* Arrows also work on touch screens, where dragging does not. */}
        {canMove && (
          <span className="inline-flex">
            <button
              type="button"
              disabled={!previous || busy}
              onClick={() => previous && onMove(glitch.glitchId, previous)}
              aria-label={previous ? `Move back to ${statusMeta[previous].label}` : 'First step'}
              title={previous ? `Back to ${statusMeta[previous].label}` : undefined}
              className={arrowClass}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              disabled={!next || busy}
              onClick={() => next && onMove(glitch.glitchId, next)}
              aria-label={next ? `Move on to ${statusMeta[next].label}` : 'Last step'}
              title={next ? `On to ${statusMeta[next].label}` : undefined}
              className={arrowClass}
            >
              <ChevronRight className="size-5" />
            </button>
          </span>
        )}
      </div>
    </li>
  )
}
