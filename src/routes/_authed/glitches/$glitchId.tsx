import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, Check, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import { EchoForm } from '#/components/EchoForm.tsx'
import { BountyActions } from '#/components/bounty/BountyActions.tsx'
import { WantedPoster } from '#/components/bounty/WantedPoster.tsx'
import { Card } from '#/components/ui/Card.tsx'
import { TimeAgo, formatAbsolute } from '#/components/ui/TimeAgo.tsx'
import {
  advanceBounty,
  assignBounty,
  getBounty,
  updateBountyTerms,
} from '#/lib/bounties.functions.ts'
import { MAX_THREAT, huntLabel, nextStatus, type BountyDetail } from '#/lib/bounty.ts'
import { GLITCH_STATUSES, formatGlitchId, type GlitchStatus } from '#/lib/glitch.ts'
import { deleteGlitch } from '#/lib/glitches.functions.ts'
import type { Guardian } from '#/lib/guardian.ts'

export const Route = createFileRoute('/_authed/glitches/$glitchId')({
  loader: ({ params }) => getBounty({ data: Number(params.glitchId) }),
  component: BountyPage,
  notFoundComponent: BountyNotFound,
})

function BountyPage() {
  const bounty = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()
  const router = useRouter()
  const isCommander = guardian.role === 'commander'
  const label = formatGlitchId(bounty.glitchId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link
        to="/bounties"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Bounty board
      </Link>

      <WantedPoster
        bounty={bounty}
        isMine={bounty.claimedByGuardianId === guardian.guardianId}
        large
      >
        <BountyActions
          bounty={bounty}
          guardian={guardian}
          showSighting={false}
          activeHunt={bounty.myActiveHunt}
        />
      </WantedPoster>

      <StatusTrack bounty={bounty} guardian={guardian} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-fg">
          Sightings <span className="font-normal text-muted">({bounty.sightings.length})</span>
        </h2>
        <ol className="relative flex flex-col gap-5 border-l-2 border-line pl-6">
          {bounty.sightings.map((sighting, i) => {
            const RoleIcon = sighting.guardian.role === 'commander' ? ShieldCheck : Shield
            return (
              <li key={sighting.echoId} className="relative">
                <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-app bg-accent ring-2 ring-glow" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium text-fg">
                    <RoleIcon className="size-4 text-accent" />
                    {sighting.guardian.codename}
                  </span>
                  <span className="text-muted capitalize">· {sighting.guardian.role}</span>
                  <span className="text-muted">·</span>
                  <TimeAgo iso={sighting.timestamp} className="text-muted" />
                  {i === 0 && (
                    <span className="rounded bg-subtle px-1.5 py-0.5 text-xs text-muted">
                      First report
                    </span>
                  )}
                </div>
                <p className="mt-1 text-fg">{sighting.description}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <Card className="flex scroll-mt-24 flex-col gap-3 p-4 sm:p-6">
        <h2 id="sighting" className="scroll-mt-24 font-semibold text-fg">
          Report a sighting of {bounty.targetName}
        </h2>
        <EchoForm
          glitchId={bounty.glitchId}
          placeholder="Where did you see it? What is it doing now?"
          submitLabel="Add sighting"
          onReported={() => router.invalidate()}
        />
      </Card>

      {isCommander && <CommanderZone bounty={bounty} label={label} />}
    </div>
  )
}

/**
 * The three steps of the hunt. A commander can click any step;
 * the hunter on the bounty can click the next one.
 */
function StatusTrack({ bounty, guardian }: { bounty: BountyDetail; guardian: Guardian }) {
  const router = useRouter()
  const advance = useServerFn(advanceBounty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentIndex = GLITCH_STATUSES.indexOf(bounty.status)
  const isCommander = guardian.role === 'commander'
  const isHunter = bounty.claimedByGuardianId === guardian.guardianId
  const next = nextStatus(bounty.status)

  function canPick(step: GlitchStatus) {
    if (step === bounty.status) return false
    return isCommander || (isHunter && step === next)
  }

  async function moveTo(step: GlitchStatus) {
    setBusy(true)
    setError(null)
    try {
      await advance({ data: { glitchId: bounty.glitchId, status: step } })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-fg">The hunt</h2>
        <p className="text-sm text-muted">
          {isCommander
            ? 'Click any step to move this bounty'
            : isHunter
              ? 'Your bounty: click the next step when you get there'
              : bounty.hunter
                ? `${bounty.hunter} is on this one`
                : 'Claim this bounty to start the hunt'}
        </p>
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {GLITCH_STATUSES.map((step, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          const content = (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  current
                    ? 'bg-mint text-copper-ink shadow-md shadow-glow'
                    : done
                      ? 'bg-accent/15 text-accent'
                      : 'bg-subtle text-muted'
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${current ? 'font-semibold text-fg' : 'text-muted'}`}>
                {huntLabel(step)}
              </span>
            </>
          )
          const base = 'flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center'
          return (
            <li key={step}>
              {canPick(step) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => moveTo(step)}
                  className={`${base} transition-colors hover:bg-subtle disabled:opacity-50`}
                >
                  {content}
                </button>
              ) : (
                <div className={base} aria-current={current ? 'step' : undefined}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {bounty.resolvedAt && (
        <p className="mt-3 text-sm text-muted" suppressHydrationWarning>
          Closed {formatAbsolute(bounty.resolvedAt)}
          {bounty.hunter ? ` · ${bounty.reward} shards paid to ${bounty.hunter}` : ' · no hunter to pay'}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </Card>
  )
}

const field =
  'w-full rounded-xl border border-line bg-app/60 px-3 py-2.5 text-base text-fg focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none'

function CommanderZone({ bounty, label }: { bounty: BountyDetail; label: string }) {
  const router = useRouter()
  const updateTerms = useServerFn(updateBountyTerms)
  const assign = useServerFn(assignBounty)
  const removeGlitch = useServerFn(deleteGlitch)
  const [reward, setReward] = useState(String(bounty.reward))
  const [threat, setThreat] = useState(bounty.threat)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      await router.invalidate()
      setMessage({ text: done, error: false })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Something went wrong.', error: true })
    } finally {
      setBusy(false)
    }
  }

  function saveTerms(event: FormEvent) {
    event.preventDefault()
    run(() => updateTerms({ data: { glitchId: bounty.glitchId, reward: Number(reward), threat } }), 'Terms updated.')
  }

  async function handleDelete() {
    if (!confirm(`Erase ${label} (${bounty.targetName}) and all its sightings?`)) return
    try {
      await removeGlitch({ data: bounty.glitchId })
      await router.navigate({ to: '/bounties' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-orange-400/40 bg-orange-500/5 p-4 sm:p-6">
      <h2 className="font-heading text-3xl text-orange-200">Commander zone</h2>

      <form onSubmit={saveTerms} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Reward (shards)
          <input
            type="number"
            min={0}
            max={100000}
            step={10}
            required
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Threat
          <select value={threat} onChange={(e) => setThreat(Number(e.target.value))} className={field}>
            {Array.from({ length: MAX_THREAT }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                {t} {'☠'.repeat(t)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-orange-300/60 px-4 py-2.5 font-semibold text-orange-100 transition hover:bg-orange-400/15 disabled:opacity-50"
        >
          Save terms
        </button>
      </form>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        Hunter
        <select
          value={bounty.claimedByGuardianId ?? ''}
          disabled={busy}
          onChange={(e) => {
            const guardianId = e.target.value === '' ? null : Number(e.target.value)
            run(
              () => assign({ data: { glitchId: bounty.glitchId, guardianId } }),
              guardianId === null ? 'Bounty unclaimed.' : 'Hunter assigned.',
            )
          }}
          className={field}
        >
          <option value="">Unclaimed (no hunter)</option>
          {bounty.defenders.map((d) => (
            <option key={d.guardianId} value={d.guardianId}>
              {d.codename}
            </option>
          ))}
        </select>
      </label>

      {message && (
        <p role={message.error ? 'alert' : 'status'} className={`text-sm ${message.error ? 'text-red-300' : 'text-mint'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-red-400/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-red-200/80">Erase this bounty and all its sightings.</p>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/60 px-4 py-2.5 font-medium text-red-200 transition-colors hover:bg-red-600 hover:text-white"
        >
          <Trash2 className="size-4" /> Delete bounty
        </button>
      </div>
    </section>
  )
}

function BountyNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-heading text-4xl text-fg">This bounty has vanished</h1>
      <p className="text-muted">It may have been erased by a commander, or it never existed.</p>
      <Link to="/bounties" className="font-medium text-accent hover:underline">
        Back to the bounty board
      </Link>
    </div>
  )
}
