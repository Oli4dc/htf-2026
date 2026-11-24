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

/** "12 minutes ago", with the exact time on hover. */
export function TimeAgo({ iso, className = '' }: { iso: string; className?: string }) {
  return (
    // Server and browser clocks/time zones differ; the browser's wins.
    <time dateTime={iso} title={formatAbsolute(iso)} className={className} suppressHydrationWarning>
      {formatRelative(iso)}
    </time>
  )
}
