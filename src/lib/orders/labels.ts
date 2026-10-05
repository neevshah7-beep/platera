import type { OrderStatus } from '@prisma/client'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Not paid',
  CONFIRMED: 'Paid, to pack',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return asked for',
  RETURNED: 'Returned',
  PAID_OUT_OF_STOCK: 'Sold to someone else, refunded',
}
