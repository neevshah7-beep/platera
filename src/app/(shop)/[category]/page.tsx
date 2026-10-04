import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CollectionView } from '@/components/tray/CollectionView'
import { getCategories } from '@/lib/catalogue'
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

  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-12">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />
      <h1 className="text-step-6">{c.name}</h1>
      <p className="measure mt-5 text-step-1 text-ink-muted">{c.summary}</p>
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
  )
}
