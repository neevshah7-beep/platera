'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { OrderStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/auth/admin'
import { notifyRefund, notifyShipmentUpdate } from '@/lib/notify/notify'
import { paymentsConfigured, refundPayment } from '@/lib/payments/razorpay'
import { NEXT_STATUS as NEXT, returnRefundPreview } from '@/lib/orders/admin'
import { createShipment, shiprocketConfigured } from '@/lib/shipping/shiprocket'

export type OrderActionState = { ok: boolean; message: string } | null

export async function moveOrder(_: OrderActionState, form: FormData): Promise<OrderActionState> {
  const user = await requireAdmin()
  const id = String(form.get('orderId'))
  const to = String(form.get('to')) as OrderStatus
  const order = await db.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) return { ok: false, message: 'Order not found.' }
  if (!(NEXT[order.status] ?? []).includes(to)) return { ok: false, message: `An order that is ${order.status.toLowerCase()} can’t go to ${to.toLowerCase()}.` }

  if (to === 'CANCELLED') {
    const r = await refund(order.id, order.totalPaise, 'Cancelled before dispatch', user.id)
    if (!r.ok) return r
    // A cancelled one-of-one goes back on sale.
    for (const i of order.items) await db.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty }, soldAt: null } })
  }

  await db.order.update({
    where: { id },
    data: { status: to, ...(to === 'SHIPPED' && { shippedAt: new Date() }), ...(to === 'DELIVERED' && { deliveredAt: new Date() }) },
  })
  await audit(user.id, 'order.status', 'Order', id, { from: order.status, to })
  if (to === 'SHIPPED') await notifyShipmentUpdate({ ...order, status: to }, 'dispatched')
  if (to === 'DELIVERED') await notifyShipmentUpdate({ ...order, status: to }, 'delivered')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/', 'layout')
  return { ok: true, message: `Marked as ${to.toLowerCase().replace('_', ' ')}.` }
}

export async function bookShipment(_: OrderActionState, form: FormData): Promise<OrderActionState> {
  const user = await requireAdmin()
  const id = String(form.get('orderId'))
  const order = await db.order.findUnique({ where: { id }, include: { items: { include: { product: true } } } })
  if (!order) return { ok: false, message: 'Order not found.' }

  // Manual entry: courier booked outside the website.
  const manualAwb = String(form.get('awb') ?? '').trim()
  if (manualAwb || !shiprocketConfigured()) {
    const courier = String(form.get('courier') ?? '').trim()
    if (!manualAwb || !courier) return { ok: false, message: 'Enter the courier name and the tracking (AWB) number.' }
    await db.order.update({ where: { id }, data: { courier, awb: manualAwb } })
    await audit(user.id, 'order.shipment.manual', 'Order', id, { courier, awb: manualAwb })
    revalidatePath(`/admin/orders/${id}`)
    return { ok: true, message: 'Tracking saved. Mark the order as shipped when the courier collects it.' }
  }

  const grossMg = order.items.reduce((s, i) => s + (i.product.grossWeightMg ?? i.product.netWeightMg ?? 50_000) * i.qty, 0)
  try {
    const s = await createShipment({
      number: order.number,
      createdAt: order.createdAt,
      name: order.name,
      email: order.email,
      phone: order.phone,
      address: order.shippingAddress as never,
      items: order.items,
      totalPaise: order.totalPaise,
      weightKg: Math.max(0.25, Math.ceil(grossMg / 1000 / 50) * 0.05 + 0.2), // piece + box, rounded up to 50 g
    })
    await db.order.update({ where: { id }, data: { shiprocketOrderId: s.shiprocketOrderId, shipmentId: s.shipmentId, awb: s.awb, courier: s.courier } })
    await audit(user.id, 'order.shipment', 'Order', id, s)
    revalidatePath(`/admin/orders/${id}`)
    return {
      ok: true,
      message: s.awb ? `Booked with ${s.courier}, tracking ${s.awb}.${s.labelUrl ? ' The label is ready to print.' : ''}` : 'Shipment created in Shiprocket. Assign a courier there to get the tracking number.',
    }
  } catch (e) {
    return { ok: false, message: `Shiprocket said: ${(e as Error).message}` }
  }
}

async function refund(orderId: string, amountPaise: number, reason: string, actorId: string, breakdown: object = {}): Promise<{ ok: boolean; message: string }> {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } })
  let razorpayRefundId: string | null = null
  if (order.razorpayPaymentId && paymentsConfigured()) {
    try {
      const r = await refundPayment(order.razorpayPaymentId, amountPaise, { order_number: order.number, reason })
      razorpayRefundId = r.id
    } catch (e) {
      return { ok: false, message: `Razorpay refused the refund: ${(e as Error).message}` }
    }
  }
  await db.refund.create({ data: { orderId, amountPaise, reason, breakdown, razorpayRefundId, createdById: actorId, status: razorpayRefundId ? 'created' : 'manual' } })
  const refunded = (await db.refund.aggregate({ where: { orderId }, _sum: { amountPaise: true } }))._sum.amountPaise ?? 0
  await db.order.update({ where: { id: orderId }, data: { paymentStatus: refunded >= order.totalPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } })
  await audit(actorId, 'order.refund', 'Order', orderId, { amountPaise, reason })
  await notifyRefund(order, amountPaise)
  return { ok: true, message: 'Refund issued.' }
}

export async function issueReturnRefund(_: OrderActionState, form: FormData): Promise<OrderActionState> {
  const user = await requireAdmin('OWNER')
  const id = String(form.get('orderId'))
  const order = await db.order.findUnique({ where: { id }, include: { items: true } })
  if (!order || order.status !== 'RETURNED') return { ok: false, message: 'Mark the order as returned (piece received and checked) first.' }
  const preview = await returnRefundPreview(id)
  const amount = preview.reduce((s, p) => s + p.refundPaise, 0)
  const confirmed = z.coerce.number().int().safeParse(form.get('confirmAmount'))
  if (!confirmed.success || confirmed.data !== amount) return { ok: false, message: 'The rate has changed since you opened this page. Reload to see the new figure.' }
  const r = await refund(id, amount, 'Return under policy', user.id, { items: preview })
  if (r.ok) for (const i of order.items) await db.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty }, soldAt: null } })
  revalidatePath(`/admin/orders/${id}`)
  return r
}

export async function saveOrderNote(form: FormData) {
  const user = await requireAdmin()
  const id = String(form.get('orderId'))
  const note = String(form.get('note') ?? '').slice(0, 2000)
  await db.order.update({ where: { id }, data: { adminNotes: note } })
  await audit(user.id, 'order.note', 'Order', id)
  revalidatePath(`/admin/orders/${id}`)
}
