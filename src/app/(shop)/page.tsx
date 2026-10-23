import { bookableDates } from '@/lib/appointments'
import { isSold, getCurrentRates, getSetting, listProducts, priceProduct } from '@/lib/catalogue'
import { mediaBase } from '@/components/media/PieceImage'
import { toPieceRef } from '@/lib/world-data'
import { originalsFor, studioFor } from '@/lib/originals'
import { STORE, whatsappLink } from '@/lib/store'
import { HomeExperience } from '@/site/HomeExperience'
import type { Metadata } from 'next'
import { social } from '@/lib/seo/meta'
import { JsonLd, storeJsonLd, websiteJsonLd } from '@/lib/seo/jsonld'

export const revalidate = 300

export const metadata: Metadata = social({
  title: { absolute: 'Platera Jewellers | Silver Jewellery Shop in Borivali West, Mumbai' },
  description:
    'Hallmarked 925 silver jewellery, chosen piece by piece: necklace sets, payals, earrings and mangalsutras. Buy on WhatsApp. Gorai 1, Borivali West, Mumbai.',
  alternates: { canonical: '/', languages: { 'en-IN': '/' } },
})

export default async function HomePage() {
  const [rates, products, closed] = await Promise.all([getCurrentRates(), listProducts(), getSetting('closedWeekdays') as Promise<number[] | null>])
  const days = bookableDates(closed ?? [], 28).map((d) => {
    const dt = new Date(`${d.value}T00:00:00Z`)
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { ...o, timeZone: 'UTC' }).format(dt)
    return { value: d.value, day: f({ day: 'numeric' }), weekday: f({ weekday: 'long' }), month: f({ month: 'long', year: 'numeric' }), long: f({ weekday: 'long', day: 'numeric', month: 'long' }) }
  })
  // The peacock pieces stay in the catalogue but are kept out of the jewellery-box showcase.
  const showcase = products.filter((p) => !/peacock/i.test(p.slug))
  const featured = [...showcase.filter((p) => p.featured), ...showcase.filter((p) => !p.featured)]
    .flatMap((p) => {
      const r = toPieceRef(p, priceProduct(p, rates))
      return r ? [{ slug: r.slug, name: r.name, price: r.price, base: mediaBase(r.src), width: r.width, height: r.height, href: `/piece/${r.slug}`, originals: originalsFor(p.sku), studio: studioFor(p.sku), productId: isSold(p) ? undefined : p.id }] : []
    })
    .slice(0, 8)
  return (
    <>
    <JsonLd data={websiteJsonLd()} />
    <JsonLd data={storeJsonLd()} />
    <HomeExperience
      pieces={featured}
      visit={{
        days,
        address: [STORE.address.line1, `${STORE.address.line2}, ${STORE.address.city} ${STORE.address.postalCode}`],
        hours: STORE.hoursText,
        phone: STORE.phoneDisplay,
        whatsapp: whatsappLink('Hello Platera, I would like to book a visit.'),
        maps: STORE.mapsUrl,
      }}
      total={products.length}
      line="Hallmarked silver, chosen piece by piece."
      collaboration="With Bhairav Jewellers · Gorai 1"
      promises={[
        { mark: '925', title: 'Hallmarked, every piece.', body: 'Sterling silver, 925 parts in a thousand, stamped by BIS with its own HUID you can check yourself.' },
        { mark: 'mg', title: 'Weighed in the open.', body: 'Every price starts from the piece’s own weight, to the milligram. Nothing is rounded in our favour.' },
        { mark: '₹', title: 'At today’s rate.', body: 'Silver is priced at the day’s rate. Ask us on WhatsApp and we send the price with its working, line by line.' },
        { mark: '15', title: 'Made for you.', body: `Send us a design on WhatsApp and it is made to order in ${STORE.madeToOrderDays}.` },
        { mark: '7', title: 'Seven days to decide.', body: 'Return within seven days; the silver is refunded at that day’s rate. Making charges and GST are not refunded.' },
        { mark: '◇', title: 'Insured to your door.', body: 'Sent by insured courier anywhere in India, boxed and sealed.' },
      ]}
    />
    </>
  )
}
