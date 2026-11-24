import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Plus } from 'lucide-react'
import { postBounty } from '#/lib/bounties.functions.ts'
import {
  LOCATIONS,
  LOCATION_LABELS,
  MAX_THREAT,
  defaultReward,
  type BountyKind,
  type Location,
} from '#/lib/bounty.ts'

const field =
  'w-full rounded-xl border border-line bg-app/60 px-3 py-2.5 text-base text-fg focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none'
const label = 'flex flex-col gap-1.5 text-sm font-medium text-muted'

/** Commander-only: post a new bounty. The server checks the role again. */
export function PostBountyForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const post = useServerFn(postBounty)
  const [targetName, setTargetName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<BountyKind>('ANOMALY')
  const [threat, setThreat] = useState(3)
  const [location, setLocation] = useState<Location>('central_nexus')
  const [reward, setReward] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const { glitchId } = await post({
        data: {
          targetName,
          description,
          kind,
          threat,
          location,
          reward: reward === '' ? undefined : Number(reward),
        },
      })
      onDone()
      await navigate({ to: '/glitches/$glitchId', params: { glitchId: String(glitchId) } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The bounty was not posted. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className={`${label} sm:col-span-2`}>
        Target name
        <input
          required
          maxLength={80}
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          placeholder="e.g. The Hollow Warden"
          className={field}
        />
      </label>
      <label className={`${label} sm:col-span-2`}>
        What do hunters need to know?
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Last seen, what it does, how dangerous it is"
          className={`${field} resize-y`}
        />
      </label>
      <label className={label}>
        Kind
        <select value={kind} onChange={(e) => setKind(e.target.value as BountyKind)} className={field}>
          <option value="ANOMALY">Anomaly</option>
          <option value="FUGITIVE">Fugitive (escaped from the Null Vault)</option>
        </select>
      </label>
      <label className={label}>
        Threat
        <select value={threat} onChange={(e) => setThreat(Number(e.target.value))} className={field}>
          {Array.from({ length: MAX_THREAT }, (_, i) => i + 1).map((t) => (
            <option key={t} value={t}>
              {t} {'☠'.repeat(t)}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        Location
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value as Location)}
          className={field}
        >
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {LOCATION_LABELS[l]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        Reward in shards
        <input
          type="number"
          min={0}
          max={100000}
          step={10}
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder={`Default for this threat: ${defaultReward(threat, kind)}`}
          className={field}
        />
      </label>

      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p role={error ? 'alert' : undefined} className={`text-sm ${error ? 'text-red-300' : 'text-muted'}`}>
          {error ?? 'Your description becomes the first sighting.'}
        </p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-5 py-3 text-lg font-bold text-copper-ink shadow-md shadow-black/30 transition hover:brightness-110 disabled:opacity-50"
        >
          <Plus className="size-5" /> {sending ? 'Posting…' : 'Post bounty'}
        </button>
      </div>
    </form>
  )
}
