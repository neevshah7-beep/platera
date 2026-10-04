import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentRates, getSetting, pricingInputFor } from '@/lib/catalogue'
import { getPricedBag } from '@/lib/cart/bag'
import { computePrice } from '@/lib/pricing/compute'
import { createRazorpayOrder, paymentsConfigured } from '@/lib/payments/razorpay'
import type { CheckoutInput } from '@/lib/validation'
import { newOrderNumber } from './token'

export type CreateOrderResult =
  | { ok: true; orderId: string; number: string; totalPaise: number; razorpayOrderId: string | null }
  | { ok: false; code: 'EMPTY' | 'UNAVAILABLE' | 'PRICES_CHANGED' | 'PAYMENT_PROVIDER' }

type ShippingSetting = { flatPaise: number; freeAbovePaise: number }

export function shippingFor(subtotalPaise: number, s: ShippingSetting | null): number {
  if (!s || !s.flatPaise) return 0
  return s.freeAbovePaise && subtotalPaise >= s.freeAbovePaise ? 0 : s.flatPaise
}

/**
 * Turns the bag into an unpaid order at the prices the customer has just seen.
 * Re-prices first: if today's rate has moved since they looked, nothing is created
 * and they're sent back to the bag to see the new figures.
 */
export async function createOrderFromBag(input: CheckoutInput): Promise<CreateOrderResult> {
  const rates = await getCurrentRates()
  const bag = await getPricedBag(rates)
  if (!bag.bagId || bag.lines.length === 0) return { ok: false, code: 'EMPTY' }
  if (bag.blocked) return { ok: false, code: 'UNAVAILABLE' }
  if (bag.changed) return { ok: false, code: 'PRICES_CHANGED' }

  const items: Prisma.OrderItemCreateWithoutOrderInput[] = []
  let taxable = 0
  let gst = 0
  for (const line of bag.lines) {
    const pricingInput = pricingInputFor(line.product)
    if (pricingInput === 'AWAITING_WEIGHT') return { ok: false, code: 'UNAVAILABLE' }
    const breakdown = computePrice(pricingInput, pricingInput.mode === 'LIVE' ? rates[pricingInput.metal] : undefined)
    taxable += breakdown.taxablePaise * line.qty
    gst += breakdown.gstPaise * line.qty
    items.push({
      product: { connect: { id: line.product.id } },
      sku: line.product.sku,
      name: line.product.name,
      qty: line.qty,
      unitTotalPaise: breakdown.totalPaise,
      pricingInput: pricingInput as unknown as Prisma.InputJsonValue,
      breakdown: JSON.parse(JSON.stringify(breakdown)) as Prisma.InputJsonValue,
    })
  }

  const shipping = shippingFor(taxable + gst, (await getSetting('shipping')) as ShippingSetting | null)
  const total = taxable + gst + shipping
  const number = newOrderNumber()

  const customer = await db.customer.upsert({
    where: { email: input.email },
    update: { name: input.address.name },
    create: { email: input.email, name: input.address.name },
  })

  const order = await db.order.create({
    data: {
      number,
      customerId: customer.id,
      name: input.address.name,
      email: input.email,
      phone: input.address.phone,
      shippingAddress: input.address,
      subtotalPaise: taxable,
      gstPaise: gst,
      shippingPaise: shipping,
      totalPaise: total,
      rates: JSON.parse(JSON.stringify(rates)) as Prisma.InputJsonValue,
      policyAcceptedAt: new Date(),
      giftMessage: input.giftMessage || null,
      hidePrices: input.hidePrices,
      items: { create: items },
    },
  })

  let razorpayOrderId: string | null = null
  if (paymentsConfigured()) {
    try {
      const rz = await createRazorpayOrder({ amountPaise: total, receipt: number, notes: { order_number: number } })
      if (rz.amount !== total) throw new Error(`Razorpay amount mismatch: ${rz.amount} vs ${total}`)
      razorpayOrderId = rz.id
      await db.order.update({ where: { id: order.id }, data: { razorpayOrderId } })
    } catch (error) {
      console.error('Razorpay order creation failed', error)
      await db.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', adminNotes: 'Payment provider unavailable at checkout.' } })
      return { ok: false, code: 'PAYMENT_PROVIDER' }
    }
  }

  return { ok: true, orderId: order.id, number, totalPaise: total, razorpayOrderId }
}
