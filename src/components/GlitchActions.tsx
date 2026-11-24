import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Trash2 } from 'lucide-react'
import { statusMeta } from '#/components/StatusBadge.tsx'
import { IconButton } from '#/components/ui/IconButton.tsx'
import { deleteGlitch, updateGlitchStatus } from '#/lib/glitches.functions.ts'
import { GLITCH_STATUSES, formatGlitchId, type GlitchStatus } from '#/lib/glitch.ts'

/** Commander-only controls. The server checks the role again. */
export function GlitchActions({
  glitchId,
  status,
  onDeleted,
}: {
  glitchId: number
  status: GlitchStatus
  onDeleted?: () => void
}) {
  const router = useRouter()
  const updateStatus = useServerFn(updateGlitchStatus)
  const removeGlitch = useServerFn(deleteGlitch)
  const [busy, setBusy] = useState(false)
  const label = formatGlitchId(glitchId)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      await router.invalidate()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <select
        aria-label={`Status of ${label}`}
        value={status}
        disabled={busy}
        onChange={(e) =>
          run(() =>
            updateStatus({ data: { glitchId, status: e.target.value as GlitchStatus } }),
          )
        }
        className="rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-fg transition-colors hover:border-accent/40 focus:border-accent focus:outline-none disabled:opacity-50"
      >
        {GLITCH_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusMeta[s].label}
          </option>
        ))}
      </select>
      <IconButton
        aria-label={`Delete ${label}`}
        title={`Delete ${label}`}
        disabled={busy}
        className="size-9 rounded-lg hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
        onClick={() => {
          if (!confirm(`Erase ${label} and all its echoes from the records?`)) return
          run(async () => {
            await removeGlitch({ data: glitchId })
            onDeleted?.()
          })
        }}
      >
        <Trash2 className="size-4.5" />
      </IconButton>
    </div>
  )
}
