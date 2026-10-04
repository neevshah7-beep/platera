import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentRates, getSetting } from '@/lib/catalogue'
import { getPricedBag } from '@/lib/cart/bag'
import { shippingFor } from '@/lib/orders/create'
import { STORE } from '@/lib/store'
import { CheckoutForm } from './CheckoutForm'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const rates = await getCurrentRates()
  const bag = await getPricedBag(rates)
  if (!bag.lines.length) redirect('/bag')
  if (bag.changed || bag.blocked) redirect('/bag?changed=1')

  const shipping = shippingFor(bag.totalPaise, (await getSetting('shipping')) as { flatPaise: number; freeAbovePaise: number } | null)
  const conditions = [
    `Returns are accepted within ${STORE.returnWindowDays} days of delivery, in the condition the piece was sent, with every component.`,
    'A returned live-rate piece is refunded at the day’s metal rate, never above the metal value you paid.',
    'Making charges, GST and other charges are not refunded.',
    'A piece that comes back damaged, altered, incomplete or with anything missing cannot be returned or bought back.',
    ...bag.lines.filter((l) => l.product.returnNote).map((l) => `${l.product.name}: ${l.product.returnNote}`),
  ]

  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-12">
      <h1 className="text-step-6">Checkout</h1>
      <CheckoutForm
        summary={{
          lines: bag.lines.map((l) => ({ id: l.id, name: l.product.name, totalPaise: l.totalPaise ?? 0 })),
          shippingPaise: shipping,
          totalPaise: bag.totalPaise + shipping,
        }}
        conditions={conditions}
      />
    </div>
  )
}
