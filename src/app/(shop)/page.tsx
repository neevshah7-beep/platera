import Link from 'next/link'
import { Ledger } from '@/components/ledger/Ledger'
import { PieceImage } from '@/components/media/PieceImage'
import { MetalRule } from '@/components/metal/LightSource'
import { RateNote } from '@/components/site/RateNote'
import { Tray } from '@/components/tray/Tray'
import { getCurrentRates, getSetting, listProducts, priceProduct } from '@/lib/catalogue'
import { STORE, whatsappLink } from '@/lib/store'

export const revalidate = 300

type Hero = { productSku: string; heading: string; body: string }

export default async function HomePage() {
  const [rates, products, hero] = await Promise.all([
    getCurrentRates(),
    listProducts(),
    getSetting('hero') as Promise<Hero | null>,
  ])
  const heroProduct = products.find((p) => p.sku === hero?.productSku) ?? products.find((p) => p.featured) ?? products[0]
  const featured = products.filter((p) => p.featured && p.id !== heroProduct?.id)
  const trayItems = [...featured, ...products.filter((p) => !p.featured && p.id !== heroProduct?.id)]
    .slice(0, 6)
    .map((product) => ({ product, pricing: priceProduct(product, rates) }))
  const heroPricing = heroProduct ? priceProduct(heroProduct, rates) : null
  const silver = rates.SILVER_925

  return (
    <>
      {/* Arrival: one piece, one light, no ceremony. */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-[var(--gutter)] pt-10 md:grid-cols-12 md:items-end md:pt-16">
        <div className="md:col-span-5 md:pb-16">
          <h1 className="text-step-6">{hero?.heading ?? 'Silver, chosen piece by piece.'}</h1>
          <p className="measure mt-6 text-step-1 text-ink-muted">{hero?.body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/collection" className="btn btn-primary">View the collection</Link>
            <Link href="/appointment" className="btn btn-quiet">Book an appointment</Link>
          </div>
          <RateNote rate={silver} className="mt-8" />
        </div>
        {heroProduct?.images[0] && (
          <Link href={`/piece/${heroProduct.slug}`} className="block md:col-span-6 md:col-start-7" aria-label={`${heroProduct.name}, view the piece`}>
            <div className="light-pass">
              <PieceImage image={heroProduct.images[0]} sizes="(min-width: 768px) 48vw, 100vw" priority />
            </div>
            <p className="mt-3 text-step--1 text-ink-muted">{heroProduct.name}</p>
          </Link>
        )}
      </section>

      {/* The Tray */}
      <section aria-labelledby="tray-heading" className="mx-auto mt-32 max-w-[1440px] px-[var(--gutter)]">
        <div className="mb-16 flex items-end justify-between gap-6">
          <h2 id="tray-heading" className="text-step-5">On the tray this week</h2>
          <Link href="/collection" className="link shrink-0 text-step--1">See all {products.length} pieces</Link>
        </div>
        <Tray items={trayItems} label="Pieces on the tray" />
      </section>

      {/* Curation: why these pieces */}
      <section aria-labelledby="curation-heading" className="ground-light mt-40">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] py-24 md:grid-cols-12 md:py-32">
          <h2 id="curation-heading" className="text-step-5 md:col-span-4">
            We don’t make jewellery. We choose it.
          </h2>
          <div className="space-y-10 md:col-span-7 md:col-start-6">
            <p className="measure text-step-1">
              Every piece at Platera is selected with Bhairav Jewellers in Gorai 1 for its quality, its craftsmanship and its
              design, and it is weighed before it reaches this page. Three questions decide what we show you, in this order.
            </p>
            <ol className="space-y-8">
              {[
                ['Is the metal what it says?', 'Every piece is 925 sterling silver and carries a BIS hallmark you can check yourself. If it can’t be hallmarked, we don’t sell it.'],
                ['Is it made properly?', 'Stones that sit level. Settings that hold without glue. Clasps that close with a click. Joins you have to look for. The back of a piece tells you more than the front, so we turn every one over.'],
                ['Will it still look right in ten years?', 'We would rather show you thirty pieces we believe in than three hundred we don’t. Nothing here is chosen because it is new this season.'],
              ].map(([q, a], i) => (
                <li key={q} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-rule-light pt-6">
                  <span className="num font-display text-step-2 text-ink-light-muted">{i + 1}</span>
                  <div>
                    <h3 className="text-step-2">{q}</h3>
                    <p className="measure mt-2 text-ink-light-muted">{a}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="measure">
              Then we price it in the open: the day’s silver rate, the weight, the making charge and the tax, each on its own
              line. <Link href="/about" className="link">Read how Platera works</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* The book, open */}
      {heroProduct && heroPricing?.state === 'PRICED' && (
        <section aria-labelledby="ledger-heading" className="mx-auto mt-32 grid max-w-[1440px] gap-12 px-[var(--gutter)] md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 id="ledger-heading" className="text-step-5">The book, open</h2>
            <p className="measure mt-6 text-ink-muted">
              A good jeweller shows you the working. Every piece on this site carries its own breakdown: weight, rate, making,
              tax. Here is the one for the {heroProduct.name}.
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <Ledger breakdown={heroPricing.breakdown} title={heroProduct.name} compact />
          </div>
        </section>
      )}

      {/* The human */}
      <section aria-labelledby="visit-heading" className="mx-auto mt-40 max-w-[1440px] px-[var(--gutter)]">
        <MetalRule />
        <div className="grid gap-12 pt-16 md:grid-cols-12">
          <h2 id="visit-heading" className="text-step-5 md:col-span-5">See it in your hand before you decide.</h2>
          <div className="grid gap-10 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="text-step-2">At the store</h3>
              <p className="mt-2 text-ink-muted">Gorai 1, Borivali West. <span className="num">{STORE.hoursText}</span>.</p>
              <Link href="/appointment?kind=store" className="link mt-3 inline-block">Book a time</Link>
            </div>
            <div>
              <h3 className="text-step-2">On a video call</h3>
              <p className="mt-2 text-ink-muted">We show each piece to the camera under good light, from every side you ask to see.</p>
              <Link href="/appointment?kind=video" className="link mt-3 inline-block">Arrange a call</Link>
            </div>
            <div>
              <h3 className="text-step-2">On WhatsApp</h3>
              <p className="mt-2 text-ink-muted">Ask anything about a piece, or send us a design to make to order in {STORE.madeToOrderDays}.</p>
              <a href={whatsappLink('Hello Platera, I would like to ask about a piece.')} className="link mt-3 inline-block">
                Message us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
