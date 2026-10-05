import Link from 'next/link'
import { RateNote } from '@/components/site/RateNote'
import { getCategories, getCurrentRates, getSetting, isSold, listProducts, priceProduct } from '@/lib/catalogue'
import { formatGrams } from '@/lib/pricing/format'
import { STORE } from '@/lib/store'
import { toPieceRef } from '@/lib/world-data'
import { Room } from '@/world/Room'

export const revalidate = 300

type Hero = { productSku: string; heading: string; body: string }

/**
 * THE HOMEPAGE: the strongest stretch of the world. Threshold → Plinth → Tray → Ledger →
 * Chamber → Vault → Craft film, each its own experience (built task by task, T7 onward;
 * see PROGRESS.md). The H1 is DOM text and the LCP element.
 */
export default async function HomePage() {
  const [rates, products, categories, hero, festival] = await Promise.all([
    getCurrentRates(),
    listProducts(),
    getCategories(),
    getSetting('hero') as Promise<Hero | null>,
    getSetting('festival') as Promise<'none' | 'diwali' | 'wedding' | null>,
  ])
  const ordered = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)]
  const refs = ordered.flatMap((p) => {
    const ref = toPieceRef(p, priceProduct(p, rates))
    return ref ? [{ p, ref }] : []
  })
  const bookPiece = products.find((p) => p.sku === hero?.productSku) ?? ordered.find((p) => !isSold(p)) ?? products[0]
  const bookRef = refs.find((x) => x.p.id === bookPiece?.id)?.ref ?? null
  const necklaces = categories.find((c) => c.slug === 'necklaces')
  const bridalCat = categories.find((c) => c.slug === 'mangalsutras')

  return (
    <>
      <Room
        state={{
          key: 'home',
          tray: refs.slice(0, 8).map((x) => x.ref),
          drawer: refs.slice(8, 14).map((x) => x.ref),
          weighed: bookRef ? { piece: bookRef, weight: bookPiece?.netWeightMg ? formatGrams(bookPiece.netWeightMg) : null } : null,
          neck: refs.find((x) => x.p.categoryId === necklaces?.id)?.ref ?? null,
          bridal: refs.filter((x) => x.p.categoryId === bridalCat?.id || x.p.categoryId === necklaces?.id).slice(0, 6).map((x) => x.ref),
          festival: festival ?? 'none',
        }}
      />
      <section aria-labelledby="hero-title" className="relative min-h-[200svh]">
        <div data-anchor={0} className="mx-auto flex h-[calc(100svh-4rem)] max-w-[1440px] items-end px-[var(--gutter)] pb-[10svh]">
          <div className="max-w-3xl">
            <p className="text-step--1 tracking-[0.18em] text-ink-muted uppercase">{STORE.collaboration}</p>
            <h1 id="hero-title" className="mt-6 text-[clamp(3.2rem,1.4rem+7vw,8.5rem)] leading-[0.92] tracking-[-0.04em]">
              {hero?.heading ?? 'Silver, chosen piece by piece.'}
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/collection" className="btn btn-primary">View the collection</Link>
              <Link href="/appointment" className="btn btn-quiet">Book a viewing</Link>
            </div>
            <RateNote rate={rates.SILVER_925} className="mt-8" />
          </div>
        </div>
        <div data-anchor={1} className="h-[100svh]" />
      </section>
    </>
  )
}
