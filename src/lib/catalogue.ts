import 'server-only'
import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { computePrice } from '@/lib/pricing/compute'
import { MAKING_PERCENTAGES, type Breakdown, type MakingPct, type MetalKey, type PriceInput, type RateSnapshot } from '@/lib/pricing/types'

/**
 * Reads are deduplicated per request with React's cache(). Freshness comes from
 * page-level ISR (revalidate = 300) plus revalidatePath('/', 'layout') whenever the
 * owner changes a rate, a product or a setting in admin.
 */

export type Rates = Partial<Record<MetalKey, RateSnapshot>>

/** Today's rate per metal: the newest row whose effective time has passed. */
export const getCurrentRates = cache(async (): Promise<Rates> => {
    const rows = await db.$queryRaw<{ id: string; metal: MetalKey; paisePerGram: number; effectiveAt: Date }[]>`
      SELECT DISTINCT ON ("metal") "id", "metal", "paisePerGram", "effectiveAt"
        FROM "MetalRate"
       WHERE "effectiveAt" <= now()
       ORDER BY "metal", "effectiveAt" DESC`
    return Object.fromEntries(rows.map((r) => [r.metal, { ...r, effectiveAt: new Date(r.effectiveAt) }]))
})

const productInclude = {
  category: true,
  images: { orderBy: [{ kind: 'asc' }, { index: 'asc' }] },
  certificates: true,
} satisfies Prisma.ProductInclude

export type ProductWithMedia = Prisma.ProductGetPayload<{ include: typeof productInclude }>

export type Pricing =
  | { state: 'PRICED'; breakdown: Breakdown; input: PriceInput }
  | { state: 'AWAITING_WEIGHT' }
  | { state: 'AWAITING_RATE' }

/**
 * The pricing input for a product, or why it can't be priced yet. A live-rate
 * piece is only priced once its weight has been confirmed (no tolerance is offered).
 */
export function pricingInputFor(p: Pick<
  ProductWithMedia,
  'pricingMode' | 'metal' | 'netWeightMg' | 'makingPct' | 'stonePaise' | 'hallmarkPaise' | 'fixedPricePaise' | 'weightVerified'
>): PriceInput | 'AWAITING_WEIGHT' {
  if (p.pricingMode === 'FIXED') {
    return p.fixedPricePaise ? { mode: 'FIXED', pricePaise: p.fixedPricePaise } : 'AWAITING_WEIGHT'
  }
  if (!p.weightVerified || !p.netWeightMg || !MAKING_PERCENTAGES.includes(p.makingPct as MakingPct)) {
    return 'AWAITING_WEIGHT'
  }
  return {
    mode: 'LIVE',
    metal: p.metal,
    netWeightMg: p.netWeightMg,
    makingPct: p.makingPct as MakingPct,
    stonePaise: p.stonePaise,
    hallmarkPaise: p.hallmarkPaise,
  }
}

export function priceProduct(p: Parameters<typeof pricingInputFor>[0], rates: Rates): Pricing {
  const input = pricingInputFor(p)
  if (input === 'AWAITING_WEIGHT') return { state: 'AWAITING_WEIGHT' }
  const rate = input.mode === 'LIVE' ? rates[input.metal] : undefined
  if (input.mode === 'LIVE' && !rate) return { state: 'AWAITING_RATE' }
  return { state: 'PRICED', input, breakdown: computePrice(input, rate) }
}

export type SortKey = 'curated' | 'price-asc' | 'price-desc' | 'weight-asc' | 'weight-desc' | 'newest'

export interface CatalogueFilters {
  category?: string
  finish?: 'silver' | 'gold-plated'
  stone?: 'none' | 'cz' | 'coloured'
  sort?: SortKey
}

export const listProducts = cache(async (filters: CatalogueFilters = {}) => {
    const where: Prisma.ProductWhereInput = { status: 'PUBLISHED' }
    if (filters.category) where.category = { slug: filters.category }
    if (filters.finish === 'gold-plated') where.finish = { not: null }
    if (filters.finish === 'silver') where.finish = null
    if (filters.stone === 'none') where.stoneType = 'NONE'
    if (filters.stone === 'cz') where.stoneType = 'CUBIC_ZIRCONIA'
    if (filters.stone === 'coloured') where.stoneType = { in: ['MIXED', 'KUNDAN_GLASS', 'GEMSTONE'] }

    const products = await db.product.findMany({
      where,
      include: productInclude,
      orderBy: filters.sort === 'newest' ? { publishedAt: 'desc' } : { position: 'asc' },
    })
    return products
})

export const getProduct = cache(async (slug: string) =>
  db.product.findFirst({ where: { slug, status: { not: 'DRAFT' } }, include: productInclude }),
)

export const getCategories = cache(async () =>
  db.category.findMany({
    orderBy: { position: 'asc' },
    include: { _count: { select: { products: { where: { status: 'PUBLISHED' } } } } },
  }),
)

export const getSetting = cache(async (key: string): Promise<unknown> =>
  (await db.setting.findUnique({ where: { key } }))?.value ?? null,
)

/** Sort priced pieces in memory: price and weight depend on today's rate. */
export function sortPriced<T extends { pricing: Pricing; product: ProductWithMedia }>(items: T[], sort: SortKey = 'curated'): T[] {
  const total = (i: T) => (i.pricing.state === 'PRICED' ? i.pricing.breakdown.totalPaise : Number.POSITIVE_INFINITY)
  const weight = (i: T) => i.product.netWeightMg ?? Number.POSITIVE_INFINITY
  const sorted = [...items]
  if (sort === 'price-asc') sorted.sort((a, b) => total(a) - total(b))
  if (sort === 'price-desc') sorted.sort((a, b) => (total(b) === Infinity ? -1 : total(b)) - (total(a) === Infinity ? -1 : total(a)))
  if (sort === 'weight-asc') sorted.sort((a, b) => weight(a) - weight(b))
  if (sort === 'weight-desc') sorted.sort((a, b) => (weight(b) === Infinity ? -1 : weight(b)) - (weight(a) === Infinity ? -1 : weight(a)))
  return sorted
}

export function isSold(p: Pick<ProductWithMedia, 'stock' | 'availability'>): boolean {
  return p.availability === 'IN_STOCK' && p.stock <= 0
}

export function metalLine(p: Pick<ProductWithMedia, 'metal' | 'finish'>): string {
  const base = p.metal === 'SILVER_925' ? '925 sterling silver' : p.metal.replace('_', ' ').toLowerCase()
  return p.finish ? `${base}, ${p.finish.toLowerCase()}` : base
}

export const STONE_LABEL: Record<ProductWithMedia['stoneType'], string> = {
  NONE: 'No stones',
  CUBIC_ZIRCONIA: 'Cubic zirconia (CZ)',
  NATURAL_DIAMOND: 'Natural diamond',
  LAB_GROWN_DIAMOND: 'Lab-grown diamond',
  KUNDAN_GLASS: 'Kundan-style stones',
  PEARL: 'Pearl',
  GEMSTONE: 'Gemstone',
  MIXED: 'Mixed stones',
}
