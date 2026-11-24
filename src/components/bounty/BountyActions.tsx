import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronsRight, Crosshair, Eye, Lock, Undo2 } from 'lucide-react'
import { advanceBounty, claimBounty, releaseBounty } from '#/lib/bounties.functions.ts'
import { FINAL_STATUS, huntLabel, nextStatus, type ActiveHunt, type Bounty } from '#/lib/bounty.ts'
import type { Guardian } from '#/lib/guardian.ts'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
const primary = `${buttonBase} bg-copper text-copper-ink shadow-md shadow-black/30 hover:brightness-110`
const secondary = `${buttonBase} border border-line text-fg hover:bg-subtle`

/**
 * Claim, Report sighting and Advance, depending on who is looking.
 * The server checks every rule again; this only hides what can't work.
 */
export function BountyActions({
  bounty,
  guardian,
  showSighting = true,
  activeHunt = null,
  compact = false,
}: {
  bounty: Bounty
  guardian: Guardian
  /** Off on the detail page, where the sighting form is right there. */
  showSighting?: boolean
  /** The viewer's current hunt: a hunter holds one active bounty at a time. */
  activeHunt?: ActiveHunt | null
  /**
   * Board cards: at most one button (Claim, or Advance on your own hunt).
   * No locked Claim and no sighting link; the board explains the lock once.
   */
  compact?: boolean
}) {
  const router = useRouter()
  const claim = useServerFn(claimBounty)
  const advance = useServerFn(advanceBounty)
  const release = useServerFn(releaseBounty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolved = bounty.status === FINAL_STATUS
  const isCommander = guardian.role === 'commander'
  const isHunter = bounty.claimedByGuardianId === guardian.guardianId
  const claimable = !resolved && guardian.role === 'defender' && bounty.claimedByGuardianId === null
  // Busy on another bounty: Claim stays visible but locked, with the reason next to it.
  const lockedBy = claimable && activeHunt && activeHunt.glitchId !== bounty.glitchId ? activeHunt : null
  const busyWith = compact ? null : lockedBy
  const canClaim = claimable && !lockedBy
  const next = nextStatus(bounty.status)
  // Commanders move bounties on the bounty page, not from every card.
  const canAdvance = next !== null && (isHunter || (isCommander && !compact))
  // Release lives on the bounty page; a card keeps one button.
  const canRelease = isHunter && !resolved && !compact
  if (compact) showSighting = false

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!canClaim && !busyWith && !canAdvance && !canRelease && !showSighting) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {busyWith && (
          <button type="button" disabled className={primary} title="One active bounty per hunter">
            <Lock className="size-4" /> Claim bounty
          </button>
        )}
        {canClaim && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => claim({ data: bounty.glitchId }))}
            className={primary}
          >
            <Crosshair className="size-4" /> Claim bounty
          </button>
        )}
        {canAdvance && next && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => advance({ data: { glitchId: bounty.glitchId } }))}
            className={canClaim ? secondary : primary}
          >
            <ChevronsRight className="size-4" /> {huntLabel(next, bounty.kind)}
          </button>
        )}
        {canRelease && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => release({ data: bounty.glitchId }))}
            className={secondary}
            title="Give up this hunt so you can claim another"
          >
            <Undo2 className="size-4" /> Release
          </button>
        )}
        {showSighting && (
          <Link
            to="/glitches/$glitchId"
            params={{ glitchId: String(bounty.glitchId) }}
            hash="sighting"
            className={secondary}
          >
            <Eye className="size-4" /> Report sighting
          </Link>
        )}
      </div>
      {busyWith && (
        <p className="text-sm text-muted">
          You're already hunting{' '}
          <Link
            to="/glitches/$glitchId"
            params={{ glitchId: String(busyWith.glitchId) }}
            className="font-semibold text-copper hover:underline"
          >
            {busyWith.targetName}
          </Link>
          . Fix or release it first.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
