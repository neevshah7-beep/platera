import { bookableDates } from '@/lib/appointments'
import { isSold, getCurrentRates, getSetting, listProducts, priceProduct } from '@/lib/catalogue'
import { mediaBase } from '@/components/media/PieceImage'
import { toPieceRef } from '@/lib/world-data'
import { originalsFor } from '@/lib/originals'
import { formatINR } from '@/lib/pricing/format'
import { STORE, whatsappLink } from '@/lib/store'
import { HomeExperience } from '@/site/HomeExperience'

export const revalidate = 300

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
      return r ? [{ slug: r.slug, name: r.name, price: r.price, base: mediaBase(r.src), width: r.width, height: r.height, href: `/piece/${r.slug}`, originals: originalsFor(p.sku), productId: isSold(p) ? undefined : p.id }] : []
    })
    .slice(0, 8)
  const silver = rates.SILVER_925
  const rate = silver ? `${formatINR(silver.paisePerGram)} a gram` : 'set each morning'
  return (
    <HomeExperience
      pieces={featured}
      rates={[
        { label: 'Silver 925, a gram', value: silver ? formatINR(silver.paisePerGram) : '—' },
        ...(rates.GOLD_22K ? [{ label: 'Gold 22k, a gram', value: formatINR(rates.GOLD_22K.paisePerGram) }] : []),
      ]}
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
        { mark: '₹', title: 'At today’s rate.', body: `Silver is priced at today’s rate, ${rate}, with the making charge and GST shown line by line.` },
        { mark: '15', title: 'Made for you.', body: `Send us a design on WhatsApp and it is made to order in ${STORE.madeToOrderDays}.` },
        { mark: '7', title: 'Seven days to decide.', body: 'Return within seven days; the silver is refunded at that day’s rate. Making charges and GST are not refunded.' },
        { mark: '◇', title: 'Insured to your door.', body: 'Sent by insured courier anywhere in India, boxed and sealed.' },
      ]}
    />
  )
}
