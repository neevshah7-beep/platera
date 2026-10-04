import type { Metadata } from 'next'
import { CollectionView } from '@/components/tray/CollectionView'
import { RoomIntro } from '@/components/world/RoomIntro'
import { getCurrentRates, listProducts, priceProduct } from '@/lib/catalogue'
import { toPieceRef } from '@/lib/world-data'

export const revalidate = 300

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
  const pieces = products.map((p) => toPieceRef(p, priceProduct(p, rates))).filter((x): x is NonNullable<typeof x> => x !== null)
  return (
    <>
      <RoomIntro
        roomKey="all"
        pieces={pieces}
        title="The collection"
        summary="Everything in the house, laid out on one long tray. Every piece is 925 sterling silver, hallmarked, and priced by its own weight at today’s rate."
      />
      <div id="list" className="ground-solid">
        <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-16">
          <h2 className="text-step-4">Every piece, as a list</h2>
          <CollectionView basePath="/collection" search={search} />
        </div>
      </div>
    </>
  )
}
