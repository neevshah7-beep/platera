import Link from 'next/link'
import { PieceImage } from '@/components/media/PieceImage'
import { isSold, metalLine, type Pricing, type ProductWithMedia } from '@/lib/catalogue'
import { formatINRWhole } from '@/lib/pricing/format'

/**
 * Pieces laid out as a jeweller lays a tray: every piece on the same cream display mat,
 * the same size, in an even grid; name and price beneath, set like a card.
 */
export function PieceGrid({ items, label, priorityFirst = false }: { items: { product: ProductWithMedia; pricing: Pricing }[]; label: string; priorityFirst?: boolean }) {
  return (
    <ul className="tray-grid" aria-label={label}>
      {items.map(({ product, pricing }, i) => {
        const img = product.images[0]
        const sold = isSold(product)
        return (
          <li key={product.id}>
            <Link href={`/piece/${product.slug}`} className="tray-card" data-sold={sold}>
              <span className="tray-mat">
                {img && <PieceImage image={img} sizes="(min-width: 1024px) 24vw, 46vw" fit="contain" priority={priorityFirst && i < 4} className="tray-img" />}
                {sold && <span className="tray-sold">Sold</span>}
              </span>
              <span className="tray-name font-display">{product.name}</span>
              <span className="tray-meta">
                <span>{metalLine(product)}</span>
                <span className="num">{sold ? 'Sold' : pricing.state === 'PRICED' ? formatINRWhole(pricing.breakdown.totalPaise) : 'Priced once weighed'}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
