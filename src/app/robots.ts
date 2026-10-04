import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/store'

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === 'production' || process.env.SITE_INDEXABLE === '1'
  return {
    rules: production
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/bag', '/checkout', '/order/', '/track/'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: ['pages', 'categories', 'pieces'].map((id) => siteUrl(`/sitemap/${id}.xml`)),
  }
}
