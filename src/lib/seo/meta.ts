import type { Metadata } from 'next'
import { STORE } from '@/lib/store'

/**
 * Fills in what a shared link shows (WhatsApp, Instagram, Google Discover) from the page's
 * own title, description and canonical path, so no page falls back to the homepage's card.
 */
/** The house card (src/app/opengraph-image.jpg), for every page without a picture of its own. */
const CARD = { url: '/opengraph-image.jpg', width: 1200, height: 630, alt: 'Platera Jewellers: hallmarked 925 silver jewellery, Gorai 1, Borivali West, Mumbai' }

export function social(m: Metadata): Metadata {
  const t = m.title
  const title = typeof t === 'string' ? t : t && typeof t === 'object' && 'absolute' in t ? t.absolute : undefined
  const canonical = m.alternates?.canonical
  const url = typeof canonical === 'string' ? canonical : undefined
  const description = m.description ?? undefined
  return {
    ...m,
    openGraph: { type: 'website', locale: 'en_IN', siteName: STORE.brand, title, description, url, images: [CARD], ...m.openGraph },
    twitter: { card: 'summary_large_image', title, description, ...m.twitter },
  }
}
