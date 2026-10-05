import 'server-only'
import { isSold, type Pricing, type ProductWithMedia } from '@/lib/catalogue'
import { formatINRWhole } from '@/lib/pricing/format'

/** A piece as the storefront presents it: its cut-out photo, size and label. */
export type PieceRef = { slug: string; name: string; src: string; width: number; height: number; price: string; gold: boolean }

/** What the 3D world needs to lay a piece on a tray: its cut-out photo, size and label. */
export function toPieceRef(product: ProductWithMedia, pricing: Pricing): PieceRef | null {
  const image = product.images.find((i) => i.kind === 'PHOTO')
  if (!image) return null
  return {
    slug: product.slug,
    name: product.name,
    src: image.src,
    width: image.width,
    height: image.height,
    price: isSold(product) ? 'Sold' : pricing.state === 'PRICED' ? formatINRWhole(pricing.breakdown.totalPaise) : 'Priced once weighed',
    gold: Boolean(product.finish?.toLowerCase().includes('gold')),
  }
}
