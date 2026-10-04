import 'server-only'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { refundPayment, paymentsConfigured } from '@/lib/payments/razorpay'
import { notifyOrderConfirmed, notifyOutOfStockRefund } from '@/lib/notify/notify'
import { confirmPaidOrder, type ConfirmOutcome } from './confirm'

/**
 * Everything that follows a captured payment, shared by the browser callback and the
 * webhook (whichever arrives first does the work; the other finds it already done):
 * confirm and decrement stock, refund at once if a one-of-one sold to someone else
 * first, empty the bag, tell the customer.
 */
export async function settlePaidOrder(orderId: string, paymentId: string): Promise<ConfirmOutcome> {
  const { outcome } = await confirmPaidOrder(orderId, paymentId)

  if (outcome === 'CONFIRMED') {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })
    // The pieces are sold; clear them from every bag that still holds them.
    await db.cartItem.deleteMany({ where: { productId: { in: order.items.map((i) => i.productId) }, product: { stock: { lte: 0 } } } })
    revalidatePath('/', 'layout')
    await notifyOrderConfirmed(order).catch((e) => console.error('notifyOrderConfirmed failed', e))
  }

  if (outcome === 'OUT_OF_STOCK') {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } })
    if (paymentsConfigured()) {
      try {
        const refund = await refundPayment(paymentId, order.totalPaise, { order_number: order.number, reason: 'sold_before_payment' })
        await db.refund.create({
          data: {
            orderId,
            amountPaise: order.totalPaise,
            reason: 'The piece sold to another customer moments before this payment completed.',
            breakdown: { full: order.totalPaise },
            razorpayRefundId: refund.id,
            status: refund.status,
          },
        })
        await db.order.update({ where: { id: orderId }, data: { paymentStatus: 'REFUNDED' } })
      } catch (e) {
        console.error('Automatic refund failed; flagged for the owner', e)
        await db.order.update({ where: { id: orderId }, data: { adminNotes: 'Automatic refund failed. Refund this payment from Razorpay.' } })
      }
    }
    await notifyOutOfStockRefund(order).catch((e) => console.error('notifyOutOfStockRefund failed', e))
  }

  return outcome
}
