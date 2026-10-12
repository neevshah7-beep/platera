import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/store'

/**
 * Search engines are let in only on the live site (SITE_INDEXABLE=1, or a Vercel production
 * deployment); every preview and staging copy tells them to stay out. The private corners
 * (admin, the API, orders, the packing step before WhatsApp) are closed everywhere.
 */
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === 'production' || process.env.SITE_INDEXABLE === '1'
  return {
    rules: production
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/buy/', '/bag', '/checkout', '/order/', '/track/'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: ['pages', 'categories', 'pieces'].map((id) => siteUrl(`/sitemap/${id}.xml`)),
    host: siteUrl(),
  }
}
