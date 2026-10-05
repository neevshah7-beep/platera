import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MetalRule } from '@/components/metal/LightSource'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { formatINR } from '@/lib/pricing/format'
import { STORE, whatsappLink } from '@/lib/store'
import { Welcome } from '@/scenes/ceremony/Welcome'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, { heading: string; body: string }> = {
  PENDING_PAYMENT: { heading: 'Waiting for payment.', body: 'We haven’t received the payment for this order yet. If you’ve paid, it can take a minute to reach us.' },
  CONFIRMED: { heading: 'Thank you. Your order is confirmed.', body: 'We’ll send tracking details by email and WhatsApp as soon as it leaves the store.' },
  PACKED: { heading: 'Packed and ready to leave.', body: 'Your order is packed. Tracking details follow as soon as the courier collects it.' },
  SHIPPED: { heading: 'On its way.', body: 'Your order is with the courier. Keep a photo ID ready for delivery.' },
  DELIVERED: { heading: 'Delivered.', body: `We hope it’s right. If it isn’t, you have ${STORE.returnWindowDays} days to return it under our returns policy.` },
  CANCELLED: { heading: 'Cancelled.', body: 'This order was cancelled. Any payment taken has been or will be refunded.' },
  RETURN_REQUESTED: { heading: 'Return requested.', body: 'We’ve received your return request and will be in touch.' },
  RETURNED: { heading: 'Returned.', body: 'The piece is back with us and your refund has been processed.' },
  PAID_OUT_OF_STOCK: {
    heading: 'We’re sorry. This piece sold moments before your payment.',
    body: 'It was a one-of-one and another customer completed their payment first. Your payment is being refunded in full; it reaches your account in 5–7 working days.',
  },
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; welcome?: string }> }) {
  const { number } = await params
  const { t, welcome } = await searchParams
  const order = await db.order.findUnique({ where: { number }, include: { items: { include: { product: { select: { slug: true } } } } } })
  if (!order || !checkOrderToken(order.id, t)) notFound()

  const status = STATUS[order.status]
  const addr = order.shippingAddress as { name: string; line1: string; line2?: string; city: string; state: string; pincode: string }

  // Just paid: the thank-you card and the ride come first. The estimate is by distance from
  // Mumbai (Shiprocket's own replaces it once the parcel is booked).
  const fresh = welcome === '1' && order.status === 'CONFIRMED'
  const days: [number, number] = addr.state === 'Maharashtra' ? [2, 4] : [4, 7]
  const fmt = (d: number) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + d * 86_400_000))

  return (
    <div className="mx-auto max-w-[960px] px-[var(--gutter)] py-16">
      {fresh && <Welcome firstName={(order.name ?? addr.name ?? '').split(' ')[0] || 'friend'} pieces={order.items.map((i) => i.name)} city={addr.city} eta={`${fmt(days[0])} – ${fmt(days[1])}`} orderNumber={order.number} />}
      <p className="num text-step--1 text-ink-muted">Order {order.number}</p>
      <h1 className="mt-3 text-step-5">{status.heading}</h1>
      <p className="measure mt-5 text-step-1 text-ink-muted">{status.body}</p>

      <div className="mt-16 grid gap-12 md:grid-cols-2">
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="font-display text-step-3">The pieces</h2>
          <ul className="num mt-6">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 border-t border-rule py-3">
                <Link href={`/piece/${i.product.slug}`} className="hover:text-argent">{i.name}</Link>
                <span>{formatINR(i.unitTotalPaise * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 border-t border-rule py-3 text-ink-muted">
              <span>Delivery</span>
              <span>{order.shippingPaise ? formatINR(order.shippingPaise) : 'Free'}</span>
            </li>
          </ul>
          <MetalRule />
          <p className="num mt-4 flex justify-between font-display text-step-2"><span>Paid</span><span>{formatINR(order.totalPaise)}</span></p>
          <p className="mt-1 text-step--1 text-ink-muted">Including GST of {formatINR(order.gstPaise)}. Your invoice is issued by {STORE.legalName}, GSTIN {STORE.gstin}.</p>
        </section>

        <section aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="font-display text-step-3">Delivery</h2>
          <address className="mt-6 not-italic">
            {addr.name}<br />{addr.line1}{addr.line2 ? <><br />{addr.line2}</> : null}<br />
            {addr.city}, {addr.state} <span className="num">{addr.pincode}</span>
          </address>
          {order.awb && (
            <p className="mt-6">
              {order.courier} · <span className="num">{order.awb}</span>{' '}
              <Link className="link" href={`/track/${order.number}?t=${t}`}>Track this parcel</Link>
            </p>
          )}
          <p className="mt-8 text-ink-muted">
            Questions about this order? <a className="link text-ink" href={whatsappLink(`Hello Platera, about my order ${order.number}.`)}>WhatsApp us</a> or call{' '}
            <a className="link num text-ink" href={`tel:${STORE.phoneE164}`}>{STORE.phoneDisplay}</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
