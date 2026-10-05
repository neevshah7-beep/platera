import Link from 'next/link'
import { PieceImage } from '@/components/media/PieceImage'
import { isSold, metalLine, type Pricing, type ProductWithMedia } from '@/lib/catalogue'
import { formatINRWhole } from '@/lib/pricing/format'

export function PriceLine({ pricing, sold }: { pricing: Pricing; sold: boolean }) {
  if (sold) return <span>Sold</span>
  if (pricing.state === 'PRICED') return <span className="num">{formatINRWhole(pricing.breakdown.totalPaise)}</span>
  return <span className="text-ink-muted">Priced once weighed</span>
}

export function PieceCard({
  product,
  pricing,
  sizes,
  priority = false,
}: {
  product: ProductWithMedia
  pricing: Pricing
  sizes: string
  priority?: boolean
}) {
  const image = product.images[0]
  const sold = isSold(product)
  return (
    <article className="group">
      <Link href={`/piece/${product.slug}`} className="block" aria-label={product.name}>
        {/* A stone-coloured panel, like a jeweller's display card; the cut-out piece rests on it. */}
        <div className="relative aspect-[4/5] overflow-hidden bg-ground-raised">
          {image && (
            <PieceImage
              image={image}
              sizes={sizes}
              priority={priority}
              fit="contain"
              className={`absolute inset-[9%] block transition-transform duration-[var(--dur-slow)] ease-[var(--ease-settle)] group-hover:scale-[1.035] ${sold ? 'opacity-60' : ''}`}
            />
          )}
          {sold && <span className="absolute left-4 top-4 text-step--1 text-ink-muted">Sold</span>}
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-step-1 tracking-[-0.015em]">{product.name}</h3>
          <p className="shrink-0 text-step--1">
            <PriceLine pricing={pricing} sold={sold} />
          </p>
        </div>
        <p className="mt-1 text-step--1 text-ink-muted">{metalLine(product)}</p>
      </Link>
    </article>
  )
}
