import type { Metadata } from 'next'
import Link from 'next/link'
import { MetalRule } from '@/components/metal/LightSource'
import { db } from '@/lib/db'
import { getCurrentRates } from '@/lib/catalogue'
import { formatINR } from '@/lib/pricing/format'
import { JsonLd } from '@/lib/seo/jsonld'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Silver Rate Today in Mumbai: 925 Sterling, per Gram',
  description:
    'Today’s 925 sterling silver jewellery rate in Mumbai per gram, per 10 grams and per kilogram, as used to price every Platera piece. With the last 30 days.',
  alternates: { canonical: '/silver-rate-today' },
}

const dt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

export default async function SilverRatePage() {
  const rates = await getCurrentRates()
  const rate = rates.SILVER_925
  const history = await db.metalRate.findMany({
    where: { metal: 'SILVER_925', effectiveAt: { lte: new Date(), gte: new Date(Date.now() - 30 * 86_400_000) } },
    orderBy: { effectiveAt: 'desc' },
    take: 60,
  })

  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is the 925 silver rate today in Mumbai?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: rate ? `Platera’s 925 sterling silver jewellery rate is ${formatINR(rate.paisePerGram)} per gram, as on ${dt.format(rate.effectiveAt)}.` : 'Today’s rate has not been set yet.',
              },
            },
            {
              '@type': 'Question',
              name: 'How is a silver jewellery price worked out?',
              acceptedAnswer: { '@type': 'Answer', text: 'Net weight in grams × the day’s rate, plus a making charge as a percentage of the metal value, plus 3% GST.' },
            },
          ],
        }}
      />
      <h1 className="text-step-6">Silver rate today</h1>
      <p className="measure mt-5 text-step-1 text-ink-muted">The rate we use to price every piece in the house, set by the store in Gorai 1, Borivali West.</p>

      {rate ? (
        <section aria-label="Today’s rate" className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            ['Per gram', rate.paisePerGram],
            ['Per 10 grams', rate.paisePerGram * 10],
            ['Per kilogram', rate.paisePerGram * 1000],
          ].map(([label, paise]) => (
            <div key={label as string}>
              <p className="text-step--1 text-ink-muted">925 sterling silver, {String(label).toLowerCase()}</p>
              <p className="num mt-2 font-display text-step-5">{formatINR(paise as number)}</p>
            </div>
          ))}
          <p className="num text-step--1 text-ink-muted md:col-span-3">
            As on <time dateTime={rate.effectiveAt.toISOString()}>{dt.format(rate.effectiveAt)}</time>. Jewellery rate for 925 silver; before making charges and GST.
          </p>
        </section>
      ) : (
        <p className="mt-14">Today’s rate hasn’t been set yet. Please check back shortly.</p>
      )}

      <section aria-labelledby="hist" className="mt-24 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 id="hist" className="text-step-4">The last 30 days</h2>
          <p className="measure mt-4 text-ink-muted">Every change we’ve made to the rate, with the time it took effect. Nothing is edited after the fact.</p>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <MetalRule />
          <table className="num mt-2 w-full text-left">
            <caption className="sr-only">925 silver rate changes in the last 30 days</caption>
            <thead><tr className="text-step--1 text-ink-muted"><th className="py-3 font-normal">From</th><th className="py-3 text-right font-normal">Per gram</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-rule">
                  <td className="py-3">{dt.format(h.effectiveAt)}</td>
                  <td className="py-3 text-right">{formatINR(h.paisePerGram)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-24 grid gap-10 border-t border-rule pt-12 md:grid-cols-12">
        <h2 className="text-step-4 md:col-span-4">How the rate becomes a price</h2>
        <div className="measure space-y-4 text-ink-muted md:col-span-7 md:col-start-6">
          <p>A piece’s price is its net weight multiplied by this rate, plus a making charge of 10, 15 or 20 percent of that metal value depending on the work, plus 3% GST on the total.</p>
          <p>Each piece shows its own working, line by line. <Link href="/collection" className="link text-ink">See the collection</Link>.</p>
        </div>
      </section>
    </div>
  )
}
