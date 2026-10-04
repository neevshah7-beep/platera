import type { Metadata } from 'next'
import Link from 'next/link'
import { PieceImage } from '@/components/media/PieceImage'
import { MetalRule } from '@/components/metal/LightSource'
import { RateNote } from '@/components/site/RateNote'
import { getCurrentRates, metalLine } from '@/lib/catalogue'
import { acknowledgeBagPrices, removeFromBag } from '@/lib/cart/actions'
import { getPricedBag } from '@/lib/cart/bag'
import { formatINR, formatINRWhole } from '@/lib/pricing/format'

export const metadata: Metadata = { title: 'Your bag', robots: { index: false } }
export const dynamic = 'force-dynamic'

const UNAVAILABLE: Record<string, string> = {
  SOLD: 'This piece has sold. Remove it to continue.',
  AWAITING_WEIGHT: 'This piece is being weighed and can’t be bought online yet.',
  AWAITING_RATE: 'Today’s rate hasn’t been set yet. Please try again shortly.',
  UNPUBLISHED: 'This piece is no longer listed.',
}

export default async function BagPage({ searchParams }: { searchParams: Promise<{ changed?: string; unavailable?: string }> }) {
  const sp = await searchParams
  const rates = await getCurrentRates()
  const bag = await getPricedBag(rates)

  if (!bag.lines.length) {
    return (
      <div className="mx-auto max-w-[1440px] px-[var(--gutter)] py-24">
        <h1 className="text-step-6">Your bag is empty.</h1>
        <p className="measure mt-5 text-ink-muted">Nothing set aside yet. Every piece in the house is on the tray.</p>
        <Link href="/collection" className="btn btn-primary mt-10">View the collection</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-16 px-[var(--gutter)] pt-12 lg:grid-cols-12">
      <section aria-labelledby="bag-heading" className="lg:col-span-7">
        <h1 id="bag-heading" className="text-step-6">Your bag</h1>

        {bag.changed && (
          <div role="alert" className="mt-10 border border-argent p-6">
            <h2 className="text-step-2">The silver rate has moved since you added {bag.lines.length > 1 ? 'these pieces' : 'this piece'}.</h2>
            <p className="measure mt-2 text-ink-muted">
              Prices here follow the day’s rate. The new figures are shown below{sp.changed ? ', and checkout will use them' : ''}. Please look them over before you pay.
            </p>
            <form action={acknowledgeBagPrices} className="mt-5">
              <button className="btn btn-primary" type="submit">I’ve seen the new prices</button>
            </form>
          </div>
        )}

        <ul className="mt-10">
          {bag.lines.map((line) => (
            <li key={line.id} className="grid grid-cols-[6.5rem_1fr] gap-5 border-t border-rule py-6 sm:grid-cols-[9rem_1fr]">
              <Link href={`/piece/${line.product.slug}`} aria-hidden tabIndex={-1}>
                {line.product.images[0] && <PieceImage image={line.product.images[0]} sizes="9rem" />}
              </Link>
              <div className="flex flex-col">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-step-2">
                    <Link href={`/piece/${line.product.slug}`}>{line.product.name}</Link>
                  </h2>
                  <p className="num shrink-0">{line.totalPaise !== null ? formatINR(line.totalPaise) : '—'}</p>
                </div>
                <p className="mt-1 text-step--1 text-ink-muted">{metalLine(line.product)} · <span className="num">{line.product.sku}</span></p>
                {line.deltaPaise !== 0 && line.totalPaise !== null && (
                  <p className="num mt-2 text-step--1">
                    Was {formatINR(line.seenTotalPaise * line.qty)} when you added it, {line.deltaPaise > 0 ? 'up' : 'down'} {formatINR(Math.abs(line.deltaPaise))}.
                  </p>
                )}
                {line.unavailable && <p className="mt-2 text-step--1 text-garnet-bright">{UNAVAILABLE[line.unavailable]}</p>}
                {line.product.returnNote && <p className="mt-2 text-step--1 text-ink-muted">{line.product.returnNote}</p>}
                <form action={removeFromBag} className="mt-auto pt-3">
                  <input type="hidden" name="lineId" value={line.id} />
                  <button type="submit" className="link text-step--1 text-ink-muted">Remove</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Summary" className="lg:col-span-4 lg:col-start-9 lg:pt-28">
        <div className="lg:sticky lg:top-24">
          <MetalRule />
          <dl className="num mt-6 space-y-3">
            <div className="flex justify-between"><dt className="text-ink-muted">Pieces</dt><dd>{bag.lines.length}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt><dd>Shown at checkout</dd></div>
            <div className="flex justify-between font-display text-step-2"><dt>Total</dt><dd>{formatINRWhole(bag.totalPaise)}</dd></div>
          </dl>
          <p className="mt-2 text-step--1 text-ink-muted">GST included. Each piece’s full breakdown is on its page.</p>
          <RateNote rate={rates.SILVER_925} className="mt-1" />
          {bag.blocked || bag.changed ? (
            <p className="mt-8 text-step--1 text-ink-muted">{bag.changed ? 'Confirm the new prices above to continue.' : 'Remove the unavailable piece to continue.'}</p>
          ) : (
            <Link href="/checkout" className="btn btn-primary mt-8 w-full">Continue to checkout</Link>
          )}
          <p className="mt-6 text-step--1 text-ink-muted">
            Prepaid only: UPI, cards, net banking. Making charges and GST are not refundable on returns. <Link href="/policies/returns" className="link">Read the returns policy</Link>.
          </p>
        </div>
      </aside>
    </div>
  )
}
