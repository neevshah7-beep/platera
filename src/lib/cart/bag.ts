import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'
import { getCurrentRates, isSold, priceProduct, type ProductWithMedia, type Rates } from '@/lib/catalogue'
import { repriceCart } from '@/lib/pricing/reprice'

export const BAG_COOKIE = 'plt_bag'

export const getBagId = cache(async (): Promise<string | undefined> => (await cookies()).get(BAG_COOKIE)?.value)

const bagInclude = {
  items: {
    orderBy: { addedAt: 'asc' as const },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: [{ kind: 'asc' as const }, { index: 'asc' as const }] },
          certificates: true,
        },
      },
    },
  },
}

export const getBag = cache(async () => {
  const id = await getBagId()
  if (!id) return null
  return db.cart.findUnique({ where: { id }, include: bagInclude })
})

export async function getBagCount(): Promise<number> {
  const bag = await getBag()
  return bag?.items.reduce((n, i) => n + i.qty, 0) ?? 0
}

export type BagLine = {
  id: string
  product: ProductWithMedia
  qty: number
  seenTotalPaise: number
  totalPaise: number | null
  deltaPaise: number
  unavailable: null | 'SOLD' | 'AWAITING_WEIGHT' | 'AWAITING_RATE' | 'UNPUBLISHED'
}

/**
 * The bag re-priced against today's rates. `changed` is true when any line's price
 * has moved since the customer last saw it; checkout will not create a payment
 * until they have seen the new figures (acknowledgeBagPrices).
 */
export async function getPricedBag(rates?: Rates) {
  const bag = await getBag()
  if (!bag) return { bagId: null, lines: [] as BagLine[], totalPaise: 0, changed: false, blocked: false }
  const r = rates ?? (await getCurrentRates())

  const lines: BagLine[] = []
  const priceable: { id: string; input: Parameters<typeof repriceCart>[0][number]['input']; seenTotalPaise: number }[] = []
  for (const item of bag.items) {
    const pricing = priceProduct(item.product, r)
    let unavailable: BagLine['unavailable'] = null
    if (item.product.status !== 'PUBLISHED') unavailable = 'UNPUBLISHED'
    else if (isSold(item.product)) unavailable = 'SOLD'
    else if (pricing.state !== 'PRICED') unavailable = pricing.state
    if (pricing.state === 'PRICED' && !unavailable) {
      priceable.push({ id: item.id, input: pricing.input, seenTotalPaise: item.seenTotalPaise })
    }
    lines.push({ id: item.id, product: item.product, qty: item.qty, seenTotalPaise: item.seenTotalPaise, totalPaise: null, deltaPaise: 0, unavailable })
  }

  const repriced = repriceCart(priceable, r)
  for (const rl of repriced.lines) {
    const line = lines.find((l) => l.id === rl.id)!
    line.totalPaise = rl.breakdown.totalPaise * line.qty
    line.deltaPaise = rl.deltaPaise * line.qty
  }

  return {
    bagId: bag.id,
    lines,
    totalPaise: lines.reduce((s, l) => s + (l.totalPaise ?? 0), 0),
    changed: repriced.changed,
    blocked: lines.some((l) => l.unavailable),
  }
}
