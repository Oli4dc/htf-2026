import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Send } from 'lucide-react'
import { Shards } from '#/components/bounty/Shards.tsx'
import { reportEcho } from '#/lib/glitches.functions.ts'
import {
  LOCATIONS,
  LOCATION_LABELS,
  MAX_THREAT,
  defaultReward,
  type Location,
} from '#/lib/bounty.ts'
import { ECHO_MAX_LENGTH } from '#/lib/glitch.ts'

const field =
  'w-full rounded-xl border border-line bg-app/60 px-3 py-2.5 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none'
const label = 'flex flex-col gap-1.5 text-sm font-medium text-muted'

/**
 * Without glitchId the echo opens a new bounty, and the form also asks for
 * its name, threat and location. With glitchId it is a sighting on that bounty.
 */
export function EchoForm({
  glitchId,
  placeholder = 'Who did you see, what did they do, and where in Achrona?',
  submitLabel = 'Send report',
  onReported,
}: {
  glitchId?: number
  placeholder?: string
  submitLabel?: string
  onReported: (glitchId: number, description: string) => void | Promise<void>
}) {
  const report = useServerFn(reportEcho)
  const opensBounty = glitchId === undefined
  const [description, setDescription] = useState('')
  const [targetName, setTargetName] = useState('')
  const [threat, setThreat] = useState(1)
  const [location, setLocation] = useState<Location>('central_nexus')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const result = await report({
        data: opensBounty
          ? { description, targetName, threat, location }
          : { description, glitchId },
      })
      setDescription('')
      setTargetName('')
      await onReported(result.glitchId, description.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The report got lost. Try again.')
    } finally {
      setSending(false)
    }
  }

  const tooLong = description.length > ECHO_MAX_LENGTH

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {opensBounty && (
        <label className={label}>
          Name it (optional)
          <input
            value={targetName}
            maxLength={80}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="Leave empty for “Unidentified anomaly”"
            className={field}
          />
        </label>
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={placeholder}
        rows={5}
        required
        aria-label="Report description"
        className="w-full resize-y rounded-2xl border border-line bg-app/60 px-4 py-3 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none"
      />

      {opensBounty && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Where?
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
          <label className={label}>
            How dangerous?
            <select value={threat} onChange={(e) => setThreat(Number(e.target.value))} className={field}>
              {Array.from({ length: MAX_THREAT }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>
                  {t} {'☠'.repeat(t)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted sm:col-span-2">
            Bounty posted on it: <Shards amount={defaultReward(threat)} />
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${error || tooLong ? 'text-red-300' : 'text-muted'}`}
          role={error ? 'alert' : undefined}
        >
          {error ?? `${description.length}/${ECHO_MAX_LENGTH} · the time is set automatically`}
        </p>
        <button
          type="submit"
          disabled={sending || !description.trim() || tooLong}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-5 py-3 text-lg font-bold text-copper-ink shadow-md shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
          {sending ? 'Sending…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
