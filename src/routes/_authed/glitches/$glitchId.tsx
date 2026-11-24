import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, Check, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import { EchoForm } from '#/components/EchoForm.tsx'
import { StatusBadge, statusMeta } from '#/components/StatusBadge.tsx'
import { Card } from '#/components/ui/Card.tsx'
import { TimeAgo, formatAbsolute } from '#/components/ui/TimeAgo.tsx'
import { deleteGlitch, getGlitch, updateGlitchStatus } from '#/lib/glitches.functions.ts'
import { GLITCH_STATUSES, formatGlitchId, type GlitchStatus } from '#/lib/glitch.ts'

export const Route = createFileRoute('/_authed/glitches/$glitchId')({
  loader: ({ params }) => getGlitch({ data: Number(params.glitchId) }),
  component: GlitchPage,
  notFoundComponent: GlitchNotFound,
})

function GlitchPage() {
  const glitch = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()
  const router = useRouter()
  const isCommander = guardian.role === 'commander'
  const label = formatGlitchId(glitch.glitchId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> All glitches
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-medium text-accent">{label}</span>
          <StatusBadge status={glitch.status} />
          <span className="text-sm text-muted" suppressHydrationWarning>
            Opened {formatAbsolute(glitch.timestamp)}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-fg sm:text-3xl">{glitch.description}</h1>
      </header>

      <StatusTracker glitchId={glitch.glitchId} status={glitch.status} editable={isCommander} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-fg">
          Echoes <span className="font-normal text-muted">({glitch.echoes.length})</span>
        </h2>
        <ol className="relative flex flex-col gap-5 border-l-2 border-line pl-6">
          {glitch.echoes.map((echo) => {
            const RoleIcon = echo.guardian.role === 'commander' ? ShieldCheck : Shield
            return (
              <li key={echo.echoId} className="relative">
                <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-white bg-accent ring-2 ring-glow" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium text-fg">
                    <RoleIcon className="size-4 text-accent" />
                    {echo.guardian.codename}
                  </span>
                  <span className="text-muted capitalize">· {echo.guardian.role}</span>
                  <span className="text-muted">·</span>
                  <TimeAgo iso={echo.timestamp} className="text-muted" />
                </div>
                <p className="mt-1 text-fg">{echo.description}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <Card className="flex flex-col gap-3 p-4 sm:p-6">
        <h2 className="font-semibold text-fg">Add an echo to {label}</h2>
        <EchoForm
          glitchId={glitch.glitchId}
          placeholder="What changed? Is it spreading or fading?"
          submitLabel="Add echo"
          onReported={() => router.invalidate()}
        />
      </Card>

      {isCommander && <DangerZone glitchId={glitch.glitchId} label={label} />}
    </div>
  )
}

/** Progress through the lifecycle; commanders click a step to move the glitch. */
function StatusTracker({
  glitchId,
  status,
  editable,
}: {
  glitchId: number
  status: GlitchStatus
  editable: boolean
}) {
  const router = useRouter()
  const updateStatus = useServerFn(updateGlitchStatus)
  const [busy, setBusy] = useState(false)
  const currentIndex = GLITCH_STATUSES.indexOf(status)

  async function moveTo(next: GlitchStatus) {
    setBusy(true)
    try {
      await updateStatus({ data: { glitchId, status: next } })
      await router.invalidate()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-fg">Status</h2>
        {editable && <p className="text-sm text-muted">Click a step to move this glitch</p>}
      </div>
      <ol className="grid grid-cols-4 gap-2">
        {GLITCH_STATUSES.map((step, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          const content = (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  current
                    ? 'bg-linear-to-br from-accent-from to-accent-to text-white shadow-md shadow-glow'
                    : done
                      ? 'bg-accent/15 text-accent'
                      : 'bg-subtle text-muted'
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={`text-xs sm:text-sm ${current ? 'font-semibold text-fg' : 'text-muted'}`}
              >
                {statusMeta[step].label}
              </span>
            </>
          )
          const base = 'flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center'
          return (
            <li key={step}>
              {editable ? (
                <button
                  type="button"
                  disabled={busy || current}
                  onClick={() => moveTo(step)}
                  className={`${base} transition-colors hover:bg-subtle disabled:cursor-default disabled:hover:bg-transparent`}
                >
                  {content}
                </button>
              ) : (
                <div className={base}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function DangerZone({ glitchId, label }: { glitchId: number; label: string }) {
  const router = useRouter()
  const removeGlitch = useServerFn(deleteGlitch)

  async function handleDelete() {
    if (!confirm(`Erase ${label} and all its echoes from the records?`)) return
    try {
      await removeGlitch({ data: glitchId })
      await router.navigate({ to: '/' })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong.')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h2 className="font-semibold text-red-800">Commander zone</h2>
        <p className="text-sm text-red-700/80">Erase this glitch and all its echoes.</p>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 font-medium text-red-700 transition-colors hover:bg-red-600 hover:text-white"
      >
        <Trash2 className="size-4" /> Delete glitch
      </button>
    </div>
  )
}

function GlitchNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-fg">This glitch has vanished</h1>
      <p className="text-muted">It may have been erased by a commander, or it never existed.</p>
      <Link to="/" className="font-medium text-accent hover:underline">
        Back to all glitches
      </Link>
    </div>
  )
}
