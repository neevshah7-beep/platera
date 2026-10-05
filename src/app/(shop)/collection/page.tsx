import type { Metadata } from 'next'
import { CollectionView } from '@/components/tray/CollectionView'
import { mediaBase } from '@/components/media/PieceImage'
import { CollectionScene } from '@/scenes/collection/CollectionScene'
import { isSold, getCurrentRates, listProducts, priceProduct } from '@/lib/catalogue'
import { toPieceRef } from '@/lib/world-data'
import { originalsFor } from '@/lib/originals'

export const revalidate = 300

/** The first pieces of a room, as the case room presents them. */
function casePieces(products: Awaited<ReturnType<typeof listProducts>>, rates: Awaited<ReturnType<typeof getCurrentRates>>) {
  return products
    .filter((p) => !/peacock/i.test(p.slug)) // kept out of the case showcase
    .flatMap((p) => {
      const r = toPieceRef(p, priceProduct(p, rates))
      return r ? [{ slug: r.slug, name: r.name, price: r.price, base: mediaBase(r.src), width: r.width, height: r.height, href: `/piece/${r.slug}`, originals: originalsFor(p.sku), productId: isSold(p) ? undefined : p.id }] : []
    })
    .slice(0, 8)
}

type Props = { searchParams: Promise<{ finish?: string; stone?: string; sort?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtered = Object.values(await searchParams).some(Boolean)
  return {
    title: 'The Collection: 925 Silver Jewellery',
    description:
      'Every piece in the house: hallmarked 925 silver necklaces, payals, earrings and mangalsutras, each priced openly by weight. Gorai 1, Borivali West, Mumbai.',
    alternates: { canonical: '/collection' },
    // Filter and sort combinations stay out of the index; the canonical is the full collection.
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function CollectionPage({ searchParams }: Props) {
  const search = await searchParams
  const [rates, products] = await Promise.all([getCurrentRates(), listProducts()])
  return (
    <>
      <h1 className="sr-only">The collection</h1>
      <CollectionScene
        pieces={casePieces(products, rates)}
        total={products.length}
        eyebrow="The collection"
        title={<>Everything in the house, <em className="accent">case by case.</em></>}
        allHref="#list"
      />
      <div id="list" className="relative bg-cream">
        <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-16">
          <h2 className="text-step-4">Every piece, as a list</h2>
          <CollectionView basePath="/collection" search={search} />
        </div>
      </div>
    </>
  )
}
