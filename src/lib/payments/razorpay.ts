import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import Razorpay from 'razorpay'

/**
 * Razorpay hosted checkout. The amount is always computed on our server from the
 * re-priced bag; the browser never tells us what to charge.
 */
export function paymentsConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

/** Local end-to-end testing without Razorpay keys. Never available in production. */
export function simulatedPayments(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PAYMENTS_DEV_SIMULATE === '1' && !paymentsConfigured()
}

let client: Razorpay | null = null
function rzp(): Razorpay {
  if (!paymentsConfigured()) throw new Error('Razorpay keys are not set (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).')
  client ??= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
  return client
}

export async function createRazorpayOrder(args: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  const order = await rzp().orders.create({
    amount: args.amountPaise,
    currency: 'INR',
    receipt: args.receipt,
    notes: args.notes,
    payment_capture: true,
  })
  return { id: order.id as string, amount: Number(order.amount) }
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex')
  const y = Buffer.from(b, 'hex')
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Signature Razorpay returns to the browser after a successful payment. */
export function verifyPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !/^[0-9a-f]+$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(`${razorpayOrderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

/** Signature on webhook deliveries, computed over the raw body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature || !/^[0-9a-f]+$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}

export async function fetchPayment(paymentId: string) {
  return rzp().payments.fetch(paymentId)
}

export async function refundPayment(paymentId: string, amountPaise: number, notes: Record<string, string>) {
  const refund = await rzp().payments.refund(paymentId, { amount: amountPaise, speed: 'normal', notes })
  return { id: refund.id as string, status: String(refund.status) }
}
