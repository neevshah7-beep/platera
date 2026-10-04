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
        <div className="overflow-hidden bg-velvet-raised">
          {image && (
            <PieceImage
              image={image}
              sizes={sizes}
              priority={priority}
              className={`block transition-[filter] duration-[var(--dur-slow)] ease-[var(--ease-settle)] group-hover:brightness-[1.08] ${sold ? 'opacity-70' : ''}`}
            />
          )}
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
