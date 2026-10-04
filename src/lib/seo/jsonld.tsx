import { STORE, siteUrl } from '@/lib/store'
import type { Pricing, ProductWithMedia } from '@/lib/catalogue'

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
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
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
  }
}

export function productJsonLd(p: ProductWithMedia, pricing: Pricing, sold: boolean) {
  const url = siteUrl(`/piece/${p.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: `${p.summary} ${p.description}`,
    image: p.images.map((i) => siteUrl(`/media/${i.src}-1600.webp`)),
    brand: { '@type': 'Brand', name: STORE.brand },
    category: p.category.name,
    material: p.finish ? `925 sterling silver, ${p.finish.toLowerCase()}` : '925 sterling silver',
    ...(pricing.state === 'PRICED' && {
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: (pricing.breakdown.totalPaise / 100).toFixed(2),
        availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': siteUrl('/#store') },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: p.returnable
            ? 'https://schema.org/MerchantReturnFiniteReturnWindow'
            : 'https://schema.org/MerchantReturnNotPermitted',
          ...(p.returnable && { merchantReturnDays: STORE.returnWindowDays, returnMethod: 'https://schema.org/ReturnByMail' }),
        },
      },
    }),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: siteUrl(it.path) })),
  }
}
