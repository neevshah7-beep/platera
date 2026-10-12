import { STORE, mediaUrl, siteUrl } from '@/lib/store'
import type { ProductWithMedia } from '@/lib/catalogue'

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapes quotes; "<" is escaped so the script can't be closed early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function storeJsonLd() {
  const a = STORE.address
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': siteUrl('/#store'),
    name: STORE.brand,
    description: `${STORE.brand}, ${STORE.collaboration.toLowerCase()}. Hallmarked 925 sterling silver jewellery.`,
    url: siteUrl('/'),
    telephone: STORE.phoneE164,
    image: siteUrl('/media/products/PLT-NKS-005-01-1600.webp'),
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Bank Transfer, Cash',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${a.line1}, ${a.line2}`,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: STORE.geo.lat, longitude: STORE.geo.lng },
    openingHoursSpecification: STORE.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: h.opens,
      closes: h.closes,
    })),
    parentOrganization: { '@type': 'Organization', name: STORE.legalName },
    areaServed: { '@type': 'Country', name: 'India' },
    hasMap: STORE.mapsUrl,
    logo: siteUrl('/icon-512.png'),
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: `+${STORE.whatsapp}`, url: `https://wa.me/${STORE.whatsapp}`, availableLanguage: ['en', 'hi', 'gu', 'mr'], areaServed: 'IN' },
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': siteUrl('/#website'),
    url: siteUrl('/'),
    name: STORE.brand,
    alternateName: 'Platera',
    inLanguage: 'en-IN',
    publisher: { '@id': siteUrl('/#store') },
  }
}

/** A collection page as a list of its pieces, so each one is discovered from the page. */
export function itemListJsonLd(name: string, path: string, pieces: { name: string; slug: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: siteUrl(path),
    isPartOf: { '@id': siteUrl('/#website') },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: pieces.length,
      itemListElement: pieces.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: siteUrl(`/piece/${p.slug}`) })),
    },
  }
}

export function productJsonLd(p: ProductWithMedia, sold: boolean) {
  const url = siteUrl(`/piece/${p.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: `${p.summary} ${p.description}`,
    image: p.images.map((i) => mediaUrl(i.src)),
    brand: { '@type': 'Brand', name: STORE.brand },
    category: p.category.name,
    material: p.finish ? `925 sterling silver, ${p.finish.toLowerCase()}` : '925 sterling silver',
    // No price is published (prices are given on WhatsApp), so there is no Offer.
    ...(sold && { additionalProperty: { '@type': 'PropertyValue', name: 'Availability', value: 'Sold' } }),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: siteUrl(it.path) })),
  }
}
