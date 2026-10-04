import 'server-only'
import type { OrderStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentRates } from '@/lib/catalogue'
import { computeReturnRefund } from '@/lib/pricing/refund'
import type { Breakdown, PriceInput } from '@/lib/pricing/types'

/** Which buttons an order offers next. Anything else is refused by moveOrder. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
}

/**
 * A return under the policy: each piece valued at today's rate (capped at what was
 * paid for the metal), making charges and GST kept. Shown to the owner first; the
 * owner confirms the figure.
 */
export async function returnRefundPreview(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })
  const rates = await getCurrentRates()
  return order.items.map((i) => {
    const input = i.pricingInput as unknown as PriceInput
    const paid = i.breakdown as unknown as Breakdown
    const r = computeReturnRefund({ input, paid, currentRate: input.mode === 'LIVE' ? rates[input.metal] : undefined })
    return { itemId: i.id, name: i.name, qty: i.qty, ...r, refundPaise: r.refundPaise * i.qty }
  })
}
