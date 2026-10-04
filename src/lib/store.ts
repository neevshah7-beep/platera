/**
 * The house's facts, in one place. Footer, contact page, JSON-LD, invoices and
 * WhatsApp links all read from here, so the name, address and phone can never
 * drift apart (Google treats inconsistent NAP as a trust signal against you).
 *
 * OPEN (docs/CLIENT_DECISIONS.md §11a): the brief and the client document give
 * different plot numbers. This uses the client document's wording.
 */
export const STORE = {
  brand: 'Platera Jewellers',
  collaboration: 'Presented in collaboration with Bhairav Jewellers, Gorai 1',
  legalName: 'Bhairav Jewellers',
  gstin: '27AOIPR9516G1ZI',
  phoneDisplay: '+91 83695 94107',
  phoneE164: '+918369594107',
  whatsapp: '918369594107',
  address: {
    line1: 'Shop No. 13, Chand Ganga Building, Plot No. 2',
    line2: 'Gorai 1, Borivali West',
    city: 'Mumbai',
    region: 'Maharashtra',
    postalCode: '400091',
    country: 'IN',
  },
  geo: { lat: 19.2311, lng: 72.8296 },
  /** Store-local times (Asia/Kolkata). Two sittings with a break in the afternoon. */
  hours: [
    { opens: '10:00', closes: '14:00' },
    { opens: '16:00', closes: '21:00' },
  ],
  hoursText: '10 am – 2 pm and 4 pm – 9 pm',
  madeToOrderDays: '15–20 days',
  returnWindowDays: 7,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bhairav+Jewellers+Gorai+1+Borivali+West+Mumbai',
} as const

export function whatsappLink(message: string): string {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`
}

export function siteUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${path}`
}

/** Absolute URL of a product image derivative, for feeds, sitemaps and structured data. */
export function mediaUrl(src: string, width: 480 | 960 | 1600 = 1600, ext: 'webp' | 'avif' = 'webp'): string {
  return src.startsWith('http') ? `${src}-${width}.${ext}` : siteUrl(`/media/${src}-${width}.${ext}`)
}
