import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { POLICIES } from '@/content/policies'
import { mediaUrl, siteUrl } from '@/lib/store'

export const revalidate = 3600

/**
 * Split by type: /sitemap/pages.xml, /sitemap/categories.xml, /sitemap/pieces.xml.
 * Sold one-of-one pieces stay listed; their pages stay live and say "sold".
 */
export async function generateSitemaps() {
  return [{ id: 'pages' }, { id: 'categories' }, { id: 'pieces' }]
}

export default async function sitemap({ id }: { id: Promise<string> | string }): Promise<MetadataRoute.Sitemap> {
  const which = await id
  if (which === 'pages') {
    return [
      { url: siteUrl('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: siteUrl('/collection'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      ...['/appointment', '/visit', '/about', '/custom', '/hallmark', '/size-guide'].map((p) => ({ url: siteUrl(p), changeFrequency: 'monthly' as const, priority: 0.6 })),
      ...POLICIES.map((p) => ({ url: siteUrl(`/policies/${p.slug}`), changeFrequency: 'yearly' as const, priority: 0.3 })),
    ]
  }
  if (which === 'categories') {
    const cats = await db.category.findMany({ select: { slug: true, products: { select: { updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 1 } } })
    return cats.map((c) => ({ url: siteUrl(`/${c.slug}`), lastModified: c.products[0]?.updatedAt, changeFrequency: 'weekly', priority: 0.8 }))
  }
  const pieces = await db.product.findMany({
    where: { status: { in: ['PUBLISHED', 'ARCHIVED'] } },
    select: { slug: true, updatedAt: true, images: { select: { src: true }, take: 1, orderBy: { index: 'asc' } } },
  })
  return pieces.map((p) => ({
    url: siteUrl(`/piece/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
    images: p.images.map((i) => mediaUrl(i.src)),
  }))
}
