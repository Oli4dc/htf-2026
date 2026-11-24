import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Send } from 'lucide-react'
import { reportEcho } from '#/lib/glitches.functions.ts'
import { ECHO_MAX_LENGTH } from '#/lib/glitch.ts'

/** Without glitchId the echo opens a new glitch. */
export function EchoForm({
  glitchId,
  placeholder = 'What did you sense? Where in Achrona?',
  submitLabel = 'Send echo',
  onReported,
}: {
  glitchId?: number
  placeholder?: string
  submitLabel?: string
  onReported: (glitchId: number) => void | Promise<void>
}) {
  const report = useServerFn(reportEcho)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const result = await report({ data: { description, glitchId } })
      setDescription('')
      await onReported(result.glitchId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The echo got lost. Try again.')
    } finally {
      setSending(false)
    }
  }

  const tooLong = description.length > ECHO_MAX_LENGTH

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={placeholder}
        rows={5}
        required
        aria-label="Echo description"
        className="w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-glow focus:outline-none"
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${error || tooLong ? 'text-red-600' : 'text-muted'}`}
          role={error ? 'alert' : undefined}
        >
          {error ?? `${description.length}/${ECHO_MAX_LENGTH} · the time is set automatically`}
        </p>
        <button
          type="submit"
          disabled={sending || !description.trim() || tooLong}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-accent-from to-accent-to px-5 py-3 font-medium text-white shadow-md shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
          {sending ? 'Sending…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
