import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { confirmPaidOrder } from '@/lib/orders/confirm'

async function makeOrder(productId: string, n: number) {
  return db.order.create({
    data: {
      number: `TEST-${Date.now()}-${n}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'Test Buyer',
      email: 'buyer@example.test',
      phone: '9999999999',
      shippingAddress: {},
      subtotalPaise: 100_000,
      gstPaise: 3_000,
      totalPaise: 103_000,
      rates: {},
      policyAcceptedAt: new Date(),
      razorpayOrderId: `order_test_${n}_${Math.random().toString(36).slice(2)}`,
      items: {
        create: {
          productId,
          sku: 'TEST-1',
          name: 'One of one',
          qty: 1,
          unitTotalPaise: 103_000,
          pricingInput: {},
          breakdown: {},
        },
      },
    },
  })
}

describe('one-of-one stock', () => {
  let productId: string

  beforeEach(async () => {
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    const cat = await db.category.create({
      data: { slug: 'test', name: 'Test', summary: '', guide: '', seoTitle: '', seoDescription: '' },
    })
    const p = await db.product.create({
      data: {
        sku: 'TEST-1', slug: 'test-1', name: 'One of one', summary: '', description: '',
        status: 'PUBLISHED', categoryId: cat.id, stock: 1, pricingMode: 'FIXED', fixedPricePaise: 103_000,
      },
    })
    productId = p.id
  })

  afterAll(async () => {
    await db.$disconnect()
  })

  it('sells exactly once when twenty paid orders confirm at the same moment', async () => {
    const orders = await Promise.all(Array.from({ length: 20 }, (_, i) => makeOrder(productId, i)))

    const results = await Promise.all(orders.map((o, i) => confirmPaidOrder(o.id, `pay_${i}`)))

    expect(results.filter((r) => r.outcome === 'CONFIRMED')).toHaveLength(1)
    expect(results.filter((r) => r.outcome === 'OUT_OF_STOCK')).toHaveLength(19)

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } })
    expect(product.stock).toBe(0)
    expect(product.soldAt).not.toBeNull()

    const statuses = await db.order.groupBy({ by: ['status'], _count: true })
    const count = Object.fromEntries(statuses.map((s) => [s.status, s._count]))
    expect(count.CONFIRMED).toBe(1)
    expect(count.PAID_OUT_OF_STOCK).toBe(19)
  })

  it('decrements stock once when the same payment is confirmed repeatedly', async () => {
    const order = await makeOrder(productId, 0)

    const results = await Promise.all(Array.from({ length: 5 }, () => confirmPaidOrder(order.id, 'pay_same')))

    expect(results.filter((r) => r.outcome === 'CONFIRMED')).toHaveLength(1)
    expect(results.filter((r) => r.outcome === 'ALREADY_PROCESSED')).toHaveLength(4)
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } })
    expect(product.stock).toBe(0)
  })
})
