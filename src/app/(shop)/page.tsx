import { getCurrentRates, listProducts, priceProduct } from '@/lib/catalogue'
import { mediaBase } from '@/components/media/PieceImage'
import { toPieceRef } from '@/lib/world-data'
import { formatINR } from '@/lib/pricing/format'
import { STORE } from '@/lib/store'
import { HomeExperience } from '@/site/HomeExperience'

export const revalidate = 300

export default async function HomePage() {
  const [rates, products] = await Promise.all([getCurrentRates(), listProducts()])
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)]
    .flatMap((p) => {
      const r = toPieceRef(p, priceProduct(p, rates))
      return r ? [{ slug: r.slug, name: r.name, price: r.price, base: mediaBase(r.src), width: r.width, height: r.height, href: `/piece/${r.slug}` }] : []
    })
    .slice(0, 8)
  const silver = rates.SILVER_925
  const rate = silver ? `${formatINR(silver.paisePerGram)} a gram` : 'set each morning'
  return (
    <HomeExperience
      pieces={featured}
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
