import { formatINR } from '@/lib/pricing/format'
import type { RateSnapshot } from '@/lib/pricing/types'

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

/** "925 silver ₹160.00 per g · rate as on 4 Oct 2026, 10:00 am". Shown beside every live price. */
export function RateNote({ rate, className = '' }: { rate?: RateSnapshot; className?: string }) {
  if (!rate) return null
  return (
    <p className={`num text-step--1 text-ink-muted ${className}`}>
      925 silver {formatINR(rate.paisePerGram)} per g · rate as on{' '}
      <time dateTime={rate.effectiveAt.toISOString()}>{when.format(rate.effectiveAt)}</time>
    </p>
  )
}
