import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/admin'
import { NEXT_STATUS, returnRefundPreview } from '@/lib/orders/admin'
import { formatINR } from '@/lib/pricing/format'
import { shiprocketConfigured } from '@/lib/shipping/shiprocket'
import { whatsappLink } from '@/lib/store'
import { STATUS_LABEL } from '@/lib/orders/labels'
import { saveOrderNote } from '../actions'
import { OrderButtons, RefundButton, ShipmentForm } from './OrderControls'

const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  const { id } = await params
  const order = await db.order.findUnique({ where: { id }, include: { items: true, refunds: { orderBy: { createdAt: 'asc' } } } })
  if (!order) notFound()
  const addr = order.shippingAddress as { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }
  const next = NEXT_STATUS[order.status] ?? []
  const preview = order.status === 'RETURNED' && user.role === 'OWNER' && order.paymentStatus === 'CAPTURED' ? await returnRefundPreview(order.id) : null
  const customerWa = (text: string) => whatsappLink(text).replace(/wa\.me\/\d+/, `wa.me/91${order.phone}`)

  return (
    <div className="space-y-12">
      <div>
        <Link href="/admin/orders" className="link text-step--1">All orders</Link>
        <h1 className="num mt-3 text-step-4">{order.number}</h1>
        <p className="mt-2 text-ink-light-muted">{STATUS_LABEL[order.status]} · placed {date.format(order.createdAt)}{order.paidAt ? ` · paid ${date.format(order.paidAt)}` : ''}</p>
        {order.adminNotes && <p className="mt-4 border-l-2 border-ruby pl-4">{order.adminNotes}</p>}
      </div>

      {next.length > 0 && <OrderButtons orderId={order.id} next={next} />}

      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="font-display text-step-3">What they bought</h2>
          <ul className="num mt-4">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 border-t border-rule-light py-3">
                <span>{i.name} <span className="text-ink-light-muted">{i.sku}</span></span>
                <span>{formatINR(i.unitTotalPaise * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-rule-light py-3 text-ink-light-muted"><span>Of which GST</span><span>{formatINR(order.gstPaise)}</span></li>
            <li className="flex justify-between border-t border-rule-light py-3 text-ink-light-muted"><span>Delivery</span><span>{formatINR(order.shippingPaise)}</span></li>
            <li className="flex justify-between border-t border-ground py-3 font-display text-step-2"><span>Paid</span><span>{formatINR(order.totalPaise)}</span></li>
          </ul>
          {order.giftMessage && <p className="mt-4">Gift card: “{order.giftMessage}”</p>}
          {order.hidePrices && <p className="mt-2 font-medium">Leave prices out of the parcel.</p>}
        </section>

        <section>
          <h2 className="font-display text-step-3">Send to</h2>
          <address className="mt-4 not-italic">
            {addr.name}<br />{addr.line1}{addr.line2 ? <><br />{addr.line2}</> : null}<br />{addr.city}, {addr.state} <span className="num">{addr.pincode}</span>
          </address>
          <p className="mt-4">
            <a className="link num" href={`tel:+91${order.phone}`}>+91 {order.phone}</a> ·{' '}
            <a className="link" href={customerWa(`Hello ${order.name.split(' ')[0]}, this is Platera Jewellers about your order ${order.number}.`)} target="_blank">WhatsApp</a> ·{' '}
            <a className="link" href={`mailto:${order.email}`}>{order.email}</a>
          </p>
          {(order.status === 'CONFIRMED' || order.status === 'PACKED') && (
            <div className="mt-8">
              <h3 className="text-step-2">Courier</h3>
              {order.awb ? (
                <p className="mt-2">{order.courier} · <span className="num">{order.awb}</span></p>
              ) : (
                <ShipmentForm orderId={order.id} connected={shiprocketConfigured()} />
              )}
            </div>
          )}
          {order.awb && order.status !== 'CONFIRMED' && order.status !== 'PACKED' && <p className="mt-6">{order.courier} · <span className="num">{order.awb}</span></p>}
        </section>
      </div>

      {preview && (
        <section className="max-w-2xl">
          <h2 className="font-display text-step-3">Refund for the return</h2>
          <p className="mt-2 text-ink-light-muted">Worked out from today’s rate under the returns policy. Making charges and GST are kept.</p>
          <ul className="num mt-4">
            {preview.map((p) => (
              <li key={p.itemId} className="border-t border-rule-light py-3">
                <div className="flex justify-between"><span>{p.name}</span><span>{formatINR(p.refundPaise)}</span></div>
                <p className="text-step--1 text-ink-light-muted">
                  {p.basis === 'CAPPED_AT_PAID' ? 'Metal at the value paid (the rate has risen)' : p.basis === 'CURRENT_RATE' ? 'Metal at today’s rate' : 'Price paid less GST'}; kept: {p.withheld.map((w) => `${w.label} ${formatINR(w.paise)}`).join(', ')}
                </p>
              </li>
            ))}
          </ul>
          <RefundButton orderId={order.id} amount={preview.reduce((s, p) => s + p.refundPaise, 0)} />
        </section>
      )}

      {order.refunds.length > 0 && (
        <section>
          <h2 className="font-display text-step-3">Refunds</h2>
          <ul className="num mt-4">
            {order.refunds.map((r) => (
              <li key={r.id} className="flex justify-between border-t border-rule-light py-3"><span>{date.format(r.createdAt)} · {r.reason}</span><span>{formatINR(r.amountPaise)}</span></li>
            ))}
          </ul>
        </section>
      )}

      <form action={saveOrderNote} className="max-w-2xl">
        <input type="hidden" name="orderId" value={order.id} />
        <label htmlFor="note" className="label">Notes for the team (the customer doesn’t see these)</label>
        <textarea id="note" name="note" rows={3} defaultValue={order.adminNotes ?? ''} className="field resize-y" />
        <button className="link mt-2">Save note</button>
      </form>
    </div>
  )
}
