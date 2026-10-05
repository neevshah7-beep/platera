import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CollectionView } from '@/components/tray/CollectionView'
import { mediaBase } from '@/components/media/PieceImage'
import { CollectionScene } from '@/scenes/collection/CollectionScene'
import { getCategories, getCurrentRates, listProducts, priceProduct } from '@/lib/catalogue'
import { toPieceRef } from '@/lib/world-data'
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'

export const revalidate = 300

/** The first pieces of a room, as the case room presents them. */
function casePieces(products: Awaited<ReturnType<typeof listProducts>>, rates: Awaited<ReturnType<typeof getCurrentRates>>) {
  return products
    .flatMap((p) => {
      const r = toPieceRef(p, priceProduct(p, rates))
      return r ? [{ slug: r.slug, name: r.name, price: r.price, base: mediaBase(r.src), width: r.width, height: r.height, href: `/piece/${r.slug}` }] : []
    })
    .slice(0, 8)
}

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

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />
      <h1 className="sr-only">{c.name}</h1>
      <CollectionScene pieces={casePieces(products, rates)} total={products.length} eyebrow={c.name} title={<>{c.name}, <em className="accent">case by case.</em></>} allHref="#list" chapterId={`room-${c.slug}`} />
      <div id="list" className="relative bg-cream">
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
