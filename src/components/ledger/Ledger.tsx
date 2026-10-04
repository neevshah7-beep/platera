import { MetalRule } from '@/components/metal/LightSource'
import { RateNote } from '@/components/site/RateNote'
import { formatINR } from '@/lib/pricing/format'
import type { Breakdown } from '@/lib/pricing/types'

/**
 * The Ledger: the price written out the way a jeweller opens the book for you.
 * Every line shows its own arithmetic, so the customer can check the total
 * without trusting us. A real table, so screen readers announce it as one.
 */
export function Ledger({
  breakdown,
  title = 'How this price is made',
  metal = 'argent',
  compact = false,
}: {
  breakdown: Breakdown
  title?: string
  metal?: 'argent' | 'champagne'
  compact?: boolean
}) {
  return (
    <figure>
      <table className="num w-full border-collapse text-left">
        <caption className={`text-left font-display ${compact ? 'text-step-2' : 'text-step-3'} pb-6`}>{title}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Working</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.lines.map((line) => (
            <tr key={line.key} className="border-t border-rule align-baseline">
              <th scope="row" className="py-4 pr-4 font-normal">
                {line.label}
                <span className="mt-1 block text-step--1 text-ink-muted sm:hidden">{line.detail}</span>
              </th>
              <td className="hidden py-4 pr-6 text-step--1 text-ink-muted sm:table-cell">{line.detail}</td>
              <td className="py-4 text-right">{formatINR(line.paise)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="p-0">
              <MetalRule metal={metal} />
            </td>
          </tr>
          <tr className="align-baseline">
            <th scope="row" className="pt-5 font-display text-step-2 font-normal">
              Price
            </th>
            <td className="hidden sm:table-cell" />
            <td className="pt-5 text-right font-display text-step-2">{formatINR(breakdown.totalPaise)}</td>
          </tr>
        </tfoot>
      </table>
      {breakdown.rate && <RateNote rate={breakdown.rate} className="mt-4" />}
    </figure>
  )
}
