const absoluteFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function formatAbsolute(iso: string) {
  return absoluteFormat.format(new Date(iso))
}

export function formatRelative(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit)
    }
  }
  return 'just now'
}

/** Compact form: "2m ago", "3h ago", "4d ago". */
export function formatRelativeShort(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`
  return `${Math.floor(seconds / 86_400)}d ago`
}

/** "12 minutes ago" (or "12m ago" with `short`), with the exact time on hover. */
export function TimeAgo({
  iso,
  short = false,
  className = '',
}: {
  iso: string
  short?: boolean
  className?: string
}) {
  return (
    // Server and browser clocks/time zones differ; the browser's wins.
    <time dateTime={iso} title={formatAbsolute(iso)} className={className} suppressHydrationWarning>
      {short ? formatRelativeShort(iso) : formatRelative(iso)}
    </time>
  )
}
