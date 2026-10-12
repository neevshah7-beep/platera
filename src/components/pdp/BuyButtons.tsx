import Link from 'next/link'

/**
 * The two ways on from a piece, both on WhatsApp: buy it (it is packed before your eyes,
 * then sent to the counter) or ask its price.
 */
export function BuyButtons({ slug, ask }: { slug: string; ask: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href={`/buy/${slug}`} className="btn btn-primary w-full">Buy on WhatsApp</Link>
      <a href={ask} target="_blank" rel="noopener" className="btn btn-quiet w-full">Check the price</a>
    </div>
  )
}
