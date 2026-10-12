import 'server-only'
import { isSold, type Pricing, type ProductWithMedia } from '@/lib/catalogue'
import { PRICE_ON_REQUEST } from '@/lib/whatsapp'

/** A piece as the storefront presents it: its cut-out photo, size and label. */
export type PieceRef = { slug: string; name: string; src: string; width: number; height: number; price: string; gold: boolean }

/** What the 3D world needs to lay a piece on a tray: its cut-out photo, size and label. */
export function toPieceRef(product: ProductWithMedia, _pricing?: Pricing): PieceRef | null {
  const image = product.images.find((i) => i.kind === 'PHOTO')
  if (!image) return null
  return {
    slug: product.slug,
    name: product.name,
    src: image.src,
    width: image.width,
    height: image.height,
    price: isSold(product) ? 'Sold' : PRICE_ON_REQUEST,
    gold: Boolean(product.finish?.toLowerCase().includes('gold')),
  }
}
