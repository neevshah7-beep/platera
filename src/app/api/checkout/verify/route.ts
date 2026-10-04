import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { settlePaidOrder } from '@/lib/orders/settle'
import { fetchPayment, verifyPaymentSignature } from '@/lib/payments/razorpay'

const body = z.object({
  orderNumber: z.string().max(40),
  token: z.string().max(64),
  razorpay_payment_id: z.string().max(64),
  razorpay_order_id: z.string().max(64),
  razorpay_signature: z.string().max(128),
})

/**
 * Called by the browser after Razorpay reports success. We trust nothing from it
 * until the signature checks out against our secret, the Razorpay order matches
 * ours, and Razorpay itself confirms the payment was captured for the right amount.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  const b = parsed.data

  const order = await db.order.findUnique({ where: { number: b.orderNumber } })
  if (!order || !checkOrderToken(order.id, b.token)) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })

  const redirect = `/order/${order.number}?t=${b.token}`
  if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'FAILED') return NextResponse.json({ redirect })

  if (order.razorpayOrderId !== b.razorpay_order_id || !verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    return NextResponse.json({ message: 'We couldn’t verify this payment. If money has left your account, call us and we’ll check it at once.' }, { status: 400 })
  }

  const payment = await fetchPayment(b.razorpay_payment_id)
  if (payment.order_id !== order.razorpayOrderId || Number(payment.amount) !== order.totalPaise || payment.currency !== 'INR') {
    console.error('Payment does not match order', { order: order.number, payment: payment.id })
    return NextResponse.json({ message: 'The payment didn’t match this order. Call us and we’ll sort it out.' }, { status: 400 })
  }
  if (payment.status !== 'captured') {
    // Authorised but not yet captured: the webhook will settle it when Razorpay captures.
    return NextResponse.json({ redirect })
  }

  await settlePaidOrder(order.id, payment.id)
  return NextResponse.json({ redirect })
}
