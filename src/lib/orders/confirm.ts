import { db } from '@/lib/db'

export type ConfirmOutcome = 'CONFIRMED' | 'OUT_OF_STOCK' | 'ALREADY_PROCESSED' | 'NOT_FOUND'

class OutOfStock extends Error {}

/**
 * Called once Razorpay has captured a payment (verified callback or webhook).
 * Stock is only ever decremented here, never at add-to-cart.
 *
 * Safety comes from two conditional updates inside one transaction:
 *  1. The order is claimed with `paymentStatus = PENDING` in the WHERE clause, so a
 *     repeated or concurrent confirmation of the same payment does nothing.
 *  2. Each product is decremented with `stock >= qty` in the WHERE clause. Postgres
 *     re-checks that condition after waiting for a competing row lock, so two buyers
 *     racing for a one-of-one cannot both succeed.
 * If any line is short, the whole transaction rolls back and the order is marked
 * PAID_OUT_OF_STOCK for an immediate refund.
 */
export async function confirmPaidOrder(orderId: string, paymentId: string): Promise<{ outcome: ConfirmOutcome }> {
  try {
    return await db.$transaction(
      async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id: orderId, paymentStatus: 'PENDING' },
          data: { paymentStatus: 'CAPTURED', razorpayPaymentId: paymentId, paidAt: new Date() },
        })
        if (claimed.count === 0) {
          const exists = await tx.order.count({ where: { id: orderId } })
          return { outcome: exists ? 'ALREADY_PROCESSED' : 'NOT_FOUND' } as const
        }

        // Lock products in a fixed order so two multi-item orders can't deadlock.
        const items = await tx.orderItem.findMany({ where: { orderId }, orderBy: { productId: 'asc' } })
        for (const item of items) {
          const updated = await tx.$executeRaw`
            UPDATE "Product"
               SET "stock" = "stock" - ${item.qty},
                   "soldAt" = CASE WHEN "stock" - ${item.qty} = 0 THEN now() ELSE "soldAt" END,
                   "updatedAt" = now()
             WHERE "id" = ${item.productId} AND "stock" >= ${item.qty}`
          if (updated === 0) throw new OutOfStock()
        }

        await tx.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
        return { outcome: 'CONFIRMED' } as const
      },
      { maxWait: 10_000, timeout: 15_000 },
    )
  } catch (error) {
    if (!(error instanceof OutOfStock)) throw error
    const marked = await db.order.updateMany({
      where: { id: orderId, paymentStatus: 'PENDING' },
      data: {
        status: 'PAID_OUT_OF_STOCK',
        paymentStatus: 'CAPTURED',
        razorpayPaymentId: paymentId,
        paidAt: new Date(),
      },
    })
    return { outcome: marked.count ? 'OUT_OF_STOCK' : 'ALREADY_PROCESSED' }
  }
}
