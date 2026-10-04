import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { settlePaidOrder } from '@/lib/orders/settle'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'

type PaymentEntity = { id: string; order_id: string; amount: number; currency: string; status: string }

/**
 * Razorpay webhooks: payment.captured and payment.failed (and refund.processed for
 * the record). Idempotent: each event id is stored once; a repeat delivery returns
 * 200 without doing anything. Settlement itself is also idempotent, so it doesn't
 * matter whether this or the browser callback arrives first.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature'))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }
  const event = JSON.parse(raw) as { event: string; payload: { payment?: { entity: PaymentEntity }; refund?: { entity: { id: string; status: string } } } }
  const eventId = req.headers.get('x-razorpay-event-id') ?? `${event.event}:${event.payload.payment?.entity.id ?? event.payload.refund?.entity.id}`

  try {
    await db.webhookEvent.create({ data: { id: eventId, provider: 'razorpay', type: event.event } })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return NextResponse.json({ ok: true, duplicate: true })
    throw e
  }

  const payment = event.payload.payment?.entity
  if (event.event === 'payment.captured' && payment) {
    const order = await db.order.findUnique({ where: { razorpayOrderId: payment.order_id } })
    if (!order) return NextResponse.json({ ok: true, ignored: 'unknown order' })
    if (payment.amount !== order.totalPaise || payment.currency !== 'INR') {
      await db.order.update({ where: { id: order.id }, data: { adminNotes: `Payment ${payment.id} amount ${payment.amount} does not match order total. Check in Razorpay.` } })
      return NextResponse.json({ ok: true, flagged: true })
    }
    await settlePaidOrder(order.id, payment.id)
  }

  if (event.event === 'payment.failed' && payment) {
    await db.order.updateMany({ where: { razorpayOrderId: payment.order_id, paymentStatus: 'PENDING' }, data: { paymentStatus: 'FAILED' } })
  }

  if (event.event === 'refund.processed' && event.payload.refund) {
    await db.refund.updateMany({ where: { razorpayRefundId: event.payload.refund.entity.id }, data: { status: 'processed' } })
  }

  return NextResponse.json({ ok: true })
}
