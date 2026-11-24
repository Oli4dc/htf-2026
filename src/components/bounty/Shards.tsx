import { Gem } from 'lucide-react'

const numberFormat = new Intl.NumberFormat('en-GB')

/** "750 shards" with a crystal icon. */
export function Shards({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tabular-nums text-cyan ${className}`}>
      <Gem aria-hidden="true" className="size-[1em]" />
      {numberFormat.format(amount)}
      <span className="font-normal text-muted">shards</span>
    </span>
  )
}
