import type { Metadata } from 'next'
import { CollectionView } from '@/components/tray/CollectionView'

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
  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-12">
      <h1 className="text-step-6">The collection</h1>
      <p className="measure mt-5 text-step-1 text-ink-muted">
        Everything in the house, laid out on one tray. Every piece is 925 sterling silver, hallmarked, and priced by its own weight at today’s rate.
      </p>
      <CollectionView basePath="/collection" search={search} />
    </div>
  )
}
