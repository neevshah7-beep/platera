import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CollectionView } from '@/components/tray/CollectionView'
import { RoomIntro } from '@/components/world/RoomIntro'
import { getCategories, getCurrentRates, listProducts, priceProduct } from '@/lib/catalogue'
import { toPieceRef } from '@/lib/world-data'
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'

export const revalidate = 300

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ finish?: string; stone?: string; sort?: string }>
}

async function findCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug)
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = await findCategory((await params).category)
  if (!c) return {}
  const filtered = Object.values(await searchParams).some(Boolean)
  return {
    title: { absolute: c.seoTitle },
    description: c.seoDescription,
    alternates: { canonical: `/${c.slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const c = await findCategory((await params).category)
  if (!c) notFound()
  const search = await searchParams
  const [rates, products] = await Promise.all([getCurrentRates(), listProducts({ category: c.slug })])
  const pieces = products.map((p) => toPieceRef(p, priceProduct(p, rates))).filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />
      <RoomIntro roomKey={c.slug} pieces={pieces} title={c.name} summary={c.summary} />
      <div id="list" className="ground-solid">
      <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-16">
      <h2 className="text-step-4">Every piece in the room</h2>
      <CollectionView basePath={`/${c.slug}`} category={c.slug} search={search} />

      <section aria-labelledby="guide-heading" className="mt-40 grid gap-10 border-t border-rule pt-12 md:grid-cols-12">
        <h2 id="guide-heading" className="text-step-4 md:col-span-4">Buying {c.name.toLowerCase()}: what to look for</h2>
        <div className="measure space-y-5 text-ink-muted md:col-span-7 md:col-start-6">
          {c.guide.split(/\n\n+/).map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
      </section>
      </div>
      </div>
    </>
  )
}
