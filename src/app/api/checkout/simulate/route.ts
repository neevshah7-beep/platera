import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { settlePaidOrder } from '@/lib/orders/settle'
import { simulatedPayments } from '@/lib/payments/razorpay'

/**
 * Development only: completes an order as if Razorpay had captured the payment, so
 * the full flow (stock, confirmation, bag clearing) can be exercised without keys.
 * Returns 404 in production or whenever real keys are configured.
 */
export async function POST(req: Request) {
  if (!simulatedPayments()) return new NextResponse(null, { status: 404 })
  const parsed = z.object({ orderNumber: z.string(), token: z.string() }).safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  const order = await db.order.findUnique({ where: { number: parsed.data.orderNumber } })
  if (!order || !checkOrderToken(order.id, parsed.data.token)) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  await settlePaidOrder(order.id, `pay_sim_${order.number}`)
  return NextResponse.json({ redirect: `/order/${order.number}?t=${parsed.data.token}&welcome=1` })
}
