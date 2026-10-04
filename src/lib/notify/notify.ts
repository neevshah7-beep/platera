import 'server-only'
import type { Appointment, Order, OrderItem, ServiceRequest } from '@prisma/client'
import { orderToken } from '@/lib/orders/token'
import { formatINR } from '@/lib/pricing/format'
import { STORE, siteUrl } from '@/lib/store'
import { sendEmail } from './email'
import { sendWhatsAppTemplate } from './whatsapp'

const orderLink = (o: Pick<Order, 'id' | 'number'>) => siteUrl(`/order/${o.number}?t=${orderToken(o.id)}`)
const trackLink = (o: Pick<Order, 'id' | 'number'>) => siteUrl(`/track/${o.number}?t=${orderToken(o.id)}`)

async function both(email: () => Promise<unknown>, whatsapp: () => Promise<unknown>) {
  const results = await Promise.allSettled([email(), whatsapp()])
  for (const r of results) if (r.status === 'rejected') console.error('notification failed', r.reason)
}

export async function notifyOrderConfirmed(order: Order & { items: OrderItem[] }) {
  await both(
    () =>
      sendEmail(order.email, {
        subject: `Your order ${order.number} is confirmed`,
        heading: `Thank you, ${order.name.split(' ')[0]}.`,
        paragraphs: [
          'Your payment has been received and your order is confirmed. We’ll send you the tracking details as soon as it leaves the store.',
        ],
        rows: [
          ...order.items.map((i) => [i.name, formatINR(i.unitTotalPaise * i.qty)] as [string, string]),
          ...(order.shippingPaise ? ([['Delivery', formatINR(order.shippingPaise)]] as [string, string][]) : []),
          ['Paid', formatINR(order.totalPaise)],
        ],
        cta: { label: 'View your order', href: orderLink(order) },
      }),
    () => sendWhatsAppTemplate(order.phone, 'order_confirmed', [order.name.split(' ')[0], order.number, formatINR(order.totalPaise), orderLink(order)]),
  )
}

export async function notifyOutOfStockRefund(order: Order) {
  await sendEmail(order.email, {
    subject: `About your order ${order.number}`,
    heading: 'We’re sorry, this piece has just sold.',
    paragraphs: [
      'Another customer completed their payment for the same one-of-one piece a moment before yours. Your payment has been refunded in full and will reach your account in 5–7 working days.',
      `If you’d like something similar found or made for you, reply to this email or message us on WhatsApp at ${STORE.phoneDisplay}.`,
    ],
    rows: [['Refunded', formatINR(order.totalPaise)]],
  }).catch((e) => console.error(e))
}

export async function notifyShipmentUpdate(order: Order, stage: 'dispatched' | 'out_for_delivery' | 'delivered') {
  const copy = {
    dispatched: { subject: `Your order ${order.number} is on its way`, heading: 'Your order has left the store.', para: `It’s travelling with ${order.courier ?? 'our courier'}${order.awb ? `, tracking number ${order.awb}` : ''}.` },
    out_for_delivery: { subject: `Your order ${order.number} arrives today`, heading: 'Your order is out for delivery.', para: 'Please keep a photo ID ready; the courier may ask to see it. If the seal on the parcel is broken, don’t accept it. Call us and we’ll handle it.' },
    delivered: { subject: `Your order ${order.number} has been delivered`, heading: 'Delivered.', para: `We hope it’s everything you hoped for. You have ${STORE.returnWindowDays} days to return it under our returns policy if it isn’t.` },
  }[stage]
  const template = ({ dispatched: 'order_dispatched', out_for_delivery: 'order_out_for_delivery', delivered: 'order_delivered' } as const)[stage]
  await both(
    () => sendEmail(order.email, { subject: copy.subject, heading: copy.heading, paragraphs: [copy.para], cta: { label: 'Track your order', href: trackLink(order) } }),
    () => sendWhatsAppTemplate(order.phone, template, [order.number, trackLink(order)]),
  )
}

export async function notifyRefund(order: Order, amountPaise: number) {
  await both(
    () =>
      sendEmail(order.email, {
        subject: `Refund for order ${order.number}`,
        heading: 'Your refund is on its way.',
        paragraphs: ['The amount below has been refunded to your original payment method. It usually reaches your account in 5–7 working days.'],
        rows: [['Refunded', formatINR(amountPaise)]],
        cta: { label: 'View your order', href: orderLink(order) },
      }),
    () => sendWhatsAppTemplate(order.phone, 'order_refunded', [order.number, formatINR(amountPaise)]),
  )
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

export async function notifyAppointmentConfirmed(a: Appointment) {
  const when = `${dateFmt.format(a.date)} at ${a.slot}`
  const where = a.kind === 'STORE_VISIT' ? `${STORE.address.line1}, ${STORE.address.line2}` : 'a WhatsApp video call to this number'
  await both(
    () =>
      a.email
        ? sendEmail(a.email, {
            subject: `Your viewing on ${dateFmt.format(a.date)}`,
            heading: 'Your viewing is confirmed.',
            paragraphs: [`We’ll see you ${when}, at ${where}. The pieces you asked about will be ready for you.`],
          })
        : Promise.resolve('skipped'),
    () => sendWhatsAppTemplate(a.phone, 'appointment_confirmed', [a.name.split(' ')[0], when, where]),
  )
}

export async function notifyServiceUpdate(s: ServiceRequest) {
  await sendWhatsAppTemplate(s.phone, 'service_update', [s.name.split(' ')[0], s.status.toLowerCase().replace('_', ' ')]).catch((e) => console.error(e))
}
