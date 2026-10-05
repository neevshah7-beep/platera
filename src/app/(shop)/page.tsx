import Link from 'next/link'
import { Ledger } from '@/components/ledger/Ledger'
import { PieceImage } from '@/components/media/PieceImage'
import { MetalRule } from '@/components/metal/LightSource'
import { RateNote } from '@/components/site/RateNote'
import { PieceCard } from '@/components/tray/PieceCard'
import { getCategories, getCurrentRates, getSetting, listProducts, priceProduct } from '@/lib/catalogue'
import { STORE, whatsappLink } from '@/lib/store'

export const revalidate = 300

type Hero = { productSku: string; heading: string; body: string }

/** The hero render from Blender: transparent, so the plinth's shadow falls on the page itself. */
function HeroRender() {
  return (
    <picture className="hero-drift hero-fade pointer-events-none block select-none">
      <source media="(min-width: 768px)" type="image/avif" srcSet="/media/hero/hero-desktop-1280.avif 1280w, /media/hero/hero-desktop-1920.avif 1920w, /media/hero/hero-desktop-2560.avif 2560w" sizes="100vw" />
      <source media="(min-width: 768px)" type="image/webp" srcSet="/media/hero/hero-desktop-1280.webp 1280w, /media/hero/hero-desktop-1920.webp 1920w, /media/hero/hero-desktop-2560.webp 2560w" sizes="100vw" />
      <source type="image/avif" srcSet="/media/hero/hero-phone-540.avif 540w, /media/hero/hero-phone-810.avif 810w, /media/hero/hero-phone-1080.avif 1080w" sizes="100vw" />
      <img
        src="/media/hero/hero-phone-810.webp"
        srcSet="/media/hero/hero-phone-540.webp 540w, /media/hero/hero-phone-810.webp 810w, /media/hero/hero-phone-1080.webp 1080w"
        sizes="100vw"
        width={1080}
        height={1350}
        alt="The Platera ring: a brilliant-cut white stone in six silver claws, standing on a block of white marble"
        fetchPriority="high"
        className="block h-auto w-full md:aspect-[16/9] md:h-full md:object-cover"
      />
    </picture>
  )
}

export default async function HomePage() {
  const [rates, products, categories, hero] = await Promise.all([
    getCurrentRates(),
    listProducts(),
    getCategories(),
    getSetting('hero') as Promise<Hero | null>,
  ])
  const silver = rates.SILVER_925
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 6)
  const rooms = categories
    .filter((c) => c._count.products > 0)
    .map((c) => ({ category: c, cover: products.find((p) => p.categoryId === c.id && p.featured) ?? products.find((p) => p.categoryId === c.id) }))
  const bookPiece = products.find((p) => p.sku === hero?.productSku) ?? products[0]
  const bookPricing = bookPiece ? priceProduct(bookPiece, rates) : null

  return (
    <>
      {/* ── Arrival ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="md:absolute md:inset-0">
          <HeroRender />
        </div>
        <div className="relative mx-auto flex max-w-[1440px] flex-col justify-end px-[var(--gutter)] pb-14 pt-2 md:min-h-[calc(100svh-4rem)] md:pb-[14svh]">
          <div className="max-w-xl">
            <p className="text-step--1 text-ink-muted">{STORE.collaboration}</p>
            <h1 className="mt-5 text-[clamp(3rem,1.6rem+5.6vw,6.75rem)] leading-[0.98] tracking-[-0.035em]">
              {hero?.heading ?? 'Silver, chosen piece by piece.'}
            </h1>
            <p className="measure mt-7 text-step-1 text-ink-muted">
              Hallmarked 925 sterling silver, selected for its making and its design, weighed and priced in the open.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/collection" className="btn btn-primary">View the collection</Link>
              <Link href="/appointment" className="btn btn-quiet">Book a viewing</Link>
            </div>
            <RateNote rate={silver} className="mt-8" />
          </div>
        </div>
      </section>

      {/* ── The tray: pieces, large, on stone ───────────────────────────────── */}
      <section aria-labelledby="tray-heading" className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-28 md:pt-40">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="tray-heading" className="text-step-5 md:col-span-6">On the tray this week</h2>
          <p className="text-ink-muted md:col-span-4 md:col-start-9">
            Each piece photographed at the store and shown at its true colour. Every price below is today’s, worked out from the piece’s own weight.
          </p>
        </div>
        {/* Three columns, each set down at a different height, as pieces are laid on a tray. */}
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-20 md:grid-cols-3 md:gap-x-[var(--gutter)] md:gap-y-24">
          {featured.map((p, i) => (
            <li key={p.id} className={['', 'md:mt-28', 'md:mt-12'][i % 3]}>
              <PieceCard product={p} pricing={priceProduct(p, rates)} sizes="(min-width: 768px) 30vw, 46vw" priority={false} />
            </li>
          ))}
        </ul>
        <div className="mt-16 flex justify-center">
          <Link href="/collection" className="btn btn-quiet">See all {products.length} pieces</Link>
        </div>
      </section>

      {/* ── The rooms: one door per collection ──────────────────────────────── */}
      <section aria-labelledby="rooms-heading" className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-32 md:pt-44">
        <h2 id="rooms-heading" className="text-step-5">The rooms</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map(({ category: c, cover }) => (
            <li key={c.id}>
              <Link href={`/${c.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-ground-raised">
                  {cover?.images[0] && (
                    <PieceImage image={cover.images[0]} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw" fit="contain" className="absolute inset-[12%] block transition-transform duration-[var(--dur-slow)] ease-[var(--ease-settle)] group-hover:scale-[1.04]" />
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="text-step-2">{c.name}</h3>
                  <span className="num text-step--1 text-ink-muted">{c._count.products}</span>
                </div>
                <p className="mt-1 text-step--1 text-ink-muted">{c.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Why these pieces ────────────────────────────────────────────────── */}
      <section aria-labelledby="curation-heading" className="ground-light mt-32 md:mt-44">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] py-24 md:grid-cols-12 md:py-36">
          <h2 id="curation-heading" className="text-step-5 md:col-span-4">We don’t make jewellery. We choose it.</h2>
          <div className="space-y-10 md:col-span-7 md:col-start-6">
            <p className="measure text-step-1">
              Every piece at Platera is selected with Bhairav Jewellers in Gorai 1 for its quality, its craftsmanship and its design,
              and it is weighed before it reaches this page. Three questions decide what we show you, in this order.
            </p>
            <ol className="space-y-8">
              {[
                ['Is the metal what it says?', 'Every piece is 925 sterling silver and carries a BIS hallmark you can check yourself.'],
                ['Is it made properly?', 'Stones that sit level. Settings that hold without glue. Clasps that close with a click. The back of a piece tells you more than the front, so we turn every one over.'],
                ['Will it still look right in ten years?', 'We would rather show you thirty pieces we believe in than three hundred we don’t.'],
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
            <Link href="/about" className="link inline-block">How Platera works</Link>
          </div>
        </div>
      </section>

      {/* ── The book, open ──────────────────────────────────────────────────── */}
      {bookPiece && bookPricing?.state === 'PRICED' && (
        <section aria-labelledby="ledger-heading" className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] pt-32 md:grid-cols-12 md:pt-44">
          <div className="md:col-span-5">
            <h2 id="ledger-heading" className="text-step-5">The book, open</h2>
            <p className="measure mt-6 text-ink-muted">
              A good jeweller shows you the working. Every piece carries its own breakdown: weight, rate, making, tax. Here is the one for the {bookPiece.name}.
            </p>
            {bookPiece.images[0] && (
              <div className="relative mt-10 aspect-square max-w-sm bg-ground-raised">
                <PieceImage image={bookPiece.images[0]} sizes="24rem" fit="contain" className="absolute inset-[10%] block" />
              </div>
            )}
          </div>
          <div className="md:col-span-6 md:col-start-7 md:pt-4">
            <Ledger breakdown={bookPricing.breakdown} title={bookPiece.name} compact />
          </div>
        </section>
      )}

      {/* ── The human ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="visit-heading" className="mx-auto max-w-[1440px] px-[var(--gutter)] pb-8 pt-32 md:pt-44">
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
              <p className="mt-2 text-ink-muted">Each piece shown to the camera under good light, from every side you ask to see.</p>
              <Link href="/appointment?kind=video" className="link mt-3 inline-block">Arrange a call</Link>
            </div>
            <div>
              <h3 className="text-step-2">On WhatsApp</h3>
              <p className="mt-2 text-ink-muted">Ask about any piece, or send a design to make to order in {STORE.madeToOrderDays}.</p>
              <a href={whatsappLink('Hello Platera, I would like to ask about a piece.')} className="link mt-3 inline-block">Message us</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
