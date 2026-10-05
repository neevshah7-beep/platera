import Link from 'next/link'
import type { FestivalKey } from '@/world/rooms/Festival'
import { Room } from '@/world/Room'
import { MoodSwitch } from '@/world/ui/MoodSwitch'
import { WorldPoster } from '@/world/ui/WorldPoster'
import { Ledger } from '@/components/ledger/Ledger'
import { RateNote } from '@/components/site/RateNote'
import { getCategories, getCurrentRates, getSetting, isSold, listProducts, priceProduct } from '@/lib/catalogue'
import { formatGrams } from '@/lib/pricing/format'
import { STORE, whatsappLink } from '@/lib/store'
import { toPieceRef } from '@/lib/world-data'

export const revalidate = 300

type Hero = { productSku: string; heading: string; body: string }

/** The Blender render: the poster while the hall loads, and all a phone without WebGL2 sees. */
function Poster() {
  return (
    <picture className="block h-full w-full select-none">
      <source media="(min-width: 768px)" type="image/avif" srcSet="/media/hero/hero-desktop-1280.avif 1280w, /media/hero/hero-desktop-1920.avif 1920w, /media/hero/hero-desktop-2560.avif 2560w" sizes="100vw" />
      <source type="image/avif" srcSet="/media/hero/hero-phone-540.avif 540w, /media/hero/hero-phone-810.avif 810w, /media/hero/hero-phone-1080.avif 1080w" sizes="100vw" />
      <img src="/media/hero/hero-phone-810.webp" width={1080} height={1350} alt="" fetchPriority="high" className="h-full w-full object-cover" />
    </picture>
  )
}

/**
 * One stop on the walk. The anchor is what the scroll measures: when it is centred in
 * the viewport the camera stands at this station. The card sits to one side so the
 * object in the hall stays in view; on phones it sits low, under the object.
 */
function Stop({ index, side = 'left', label, children, tall = true }: { index: number; side?: 'left' | 'right'; label: string; children: React.ReactNode; tall?: boolean }) {
  return (
    <section aria-labelledby={`stop-${index}`} className={`relative ${tall ? 'min-h-[175svh]' : ''}`}>
      <div data-anchor={index} className="mx-auto flex h-[100svh] max-w-[1440px] items-end px-[var(--gutter)] pb-6 md:items-center md:pb-0">
        <div className={`card-over-hall w-full max-w-[29rem] ${side === 'right' ? 'md:ml-auto' : ''}`}>
          <p className="num text-step--1 text-ink-muted">
            <span className="mr-3">{String(index).padStart(2, '0')}</span>
            {label}
          </p>
          {children}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const [rates, products, categories, hero, festival] = await Promise.all([
    getCurrentRates(),
    listProducts(),
    getCategories(),
    getSetting('hero') as Promise<Hero | null>,
    getSetting('festival') as Promise<FestivalKey | null>,
  ])
  const silver = rates.SILVER_925
  const ordered = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)]
  const refs = ordered.flatMap((p) => {
    const ref = toPieceRef(p, priceProduct(p, rates))
    return ref ? [{ p, ref }] : []
  })
  const tray = refs.slice(0, 6)
  const vault = refs.slice(6, 12)
  const bookPiece = products.find((p) => p.sku === hero?.productSku) ?? ordered.find((p) => !isSold(p)) ?? products[0]
  const bookPricing = bookPiece ? priceProduct(bookPiece, rates) : null
  const bookRef = refs.find((x) => x.p.id === bookPiece?.id)?.ref ?? null
  const necklaces = categories.find((c) => c.slug === 'necklaces')
  const neckRef = refs.find((x) => x.p.categoryId === necklaces?.id)?.ref ?? null
  const rooms = categories.filter((c) => c._count.products > 0)
  const bridalCat = categories.find((c) => c.slug === 'mangalsutras')
  const bridal = refs.filter((x) => x.p.categoryId === bridalCat?.id || x.p.categoryId === necklaces?.id).slice(0, 6)

  return (
    <>
      <WorldPoster>
        <Poster />
      </WorldPoster>
      <Room
        state={{
          key: 'home',
          tray: tray.map((x) => x.ref),
          drawer: vault.map((x) => x.ref),
          weighed: bookRef ? { piece: bookRef, weight: bookPiece?.netWeightMg ? formatGrams(bookPiece.netWeightMg) : null } : null,
          neck: neckRef,
          bridal: bridal.map((x) => x.ref),
          festival: festival ?? 'none',
        }}
      />

      <div className="relative">
        {/* 00 · Arrival */}
        <section aria-labelledby="stop-0" className="relative min-h-[150svh]">
          <div data-anchor={0} className="mx-auto flex h-[calc(100svh-4rem)] max-w-[1440px] items-end px-[var(--gutter)] pb-[9svh]">
            <div className="max-w-2xl">
              <p className="text-step--1 text-ink-muted">{STORE.collaboration}</p>
              <h1 id="stop-0" className="mt-5 text-[clamp(3rem,1.6rem+5.6vw,7rem)] leading-[0.96] tracking-[-0.035em]">
                {hero?.heading ?? 'Silver, chosen piece by piece.'}
              </h1>
              <p className="measure mt-6 text-step-1 text-ink-muted">
                Hallmarked 925 sterling silver, selected for its making and its design, weighed and priced in the open.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/collection" className="btn btn-primary">View the collection</Link>
                <Link href="/appointment" className="btn btn-quiet">Book a viewing</Link>
              </div>
              <RateNote rate={silver} className="mt-7" />
            </div>
          </div>
          <p aria-hidden className="scroll-cue absolute bottom-[52svh] right-[var(--gutter)] hidden text-step--1 text-ink-muted md:block">Scroll to walk in</p>
        </section>

        <Stop index={1} label="The stone" side="right">
          <h2 id="stop-1" className="mt-4 text-step-4">Cut to give back the light.</h2>
          <p className="measure mt-4 text-ink-muted">
            The white stones in our settings are cubic zirconia, cut with fifty-seven facets, and every piece says so. Move your pointer and the stone turns; watch the colour break at its edges.
          </p>
        </Stop>

        <Stop index={2} label="The hallmark">
          <h2 id="stop-2" className="mt-4 text-step-4">Struck into the metal.</h2>
          <p className="measure mt-4 text-ink-muted">
            Every Platera piece is 925 sterling silver and carries a BIS hallmark with its own HUID. You can check it yourself, on the BIS CARE app, before you pay.
          </p>
          <Link href="/hallmark" className="link mt-5 inline-block">How to read a hallmark</Link>
        </Stop>

        <Stop index={3} label="The tray" side="right">
          <h2 id="stop-3" className="mt-4 text-step-4">On the tray this week.</h2>
          <p className="measure mt-4 text-ink-muted">Point at a piece and it is lifted to the lamp. Choose one to see it closer. Every price is today’s, from the piece’s own weight.</p>
          <ul className="mt-6 divide-y divide-rule-light border-y border-rule-light">
            {tray.map(({ p, ref }) => (
              <li key={p.id}>
                <Link href={`/piece/${p.slug}`} className="flex items-baseline justify-between gap-4 py-2.5 hover:text-ink-muted">
                  <span>{p.name}</span>
                  <span className="num text-step--1 text-ink-muted">{ref.price}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Stop>

        <Stop index={4} label="The drawer">
          <h2 id="stop-4" className="mt-4 text-step-4">There is more in the drawer.</h2>
          <p className="measure mt-4 text-ink-muted">
            <span className="num">{products.length}</span> pieces in all, each chosen with Bhairav Jewellers for its making and its design. Open a room:
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-2">
            {rooms.map((c) => (
              <li key={c.id}>
                <Link href={`/${c.slug}`} className="flex items-baseline justify-between border border-rule-light px-4 py-3 transition-colors hover:border-ink">
                  <span>{c.name}</span>
                  <span className="num text-step--1 text-ink-muted">{c._count.products}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Stop>

        <Stop index={5} label="The weighing" side="right">
          <h2 id="stop-5" className="mt-4 text-step-4">Weighed in the open.</h2>
          <p className="measure mt-4 text-ink-muted">A good jeweller shows you the working. Every piece carries its own breakdown: weight, today’s rate, making, tax.</p>
          {bookPiece && bookPricing?.state === 'PRICED' && (
            <div className="mt-6">
              <Ledger breakdown={bookPricing.breakdown} title={bookPiece.name} compact />
            </div>
          )}
        </Stop>

        <Stop index={6} label="On the neck">
          <h2 id="stop-6" className="mt-4 text-step-4">See where it will sit.</h2>
          <p className="measure mt-4 text-ink-muted">Sixteen inches sits at the collarbone; twenty-four falls toward the heart. Then see it in the light it will be worn in.</p>
          <MoodSwitch className="mt-6" />
          <Link href="/size-guide" className="link mt-5 inline-block">The size guide</Link>
        </Stop>

        <Stop index={7} label="The box" side="right">
          <h2 id="stop-7" className="mt-4 text-step-4">Boxed, tied, insured.</h2>
          <p className="measure mt-4 text-ink-muted">
            Every piece leaves in a Platera box, sent by insured courier anywhere in India. Seven days to return it, refunded at the day’s silver rate; making charges and GST are not refundable.
          </p>
          <Link href="/policies" className="link mt-5 inline-block">Returns and buyback</Link>
        </Stop>

        <Stop index={8} label="The counter" tall={false}>
          <h2 id="stop-8" className="mt-4 text-step-4">See it in your hand before you decide.</h2>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="font-display text-step-1">At the store</dt>
              <dd className="mt-1 text-ink-muted">Gorai 1, Borivali West. <span className="num">{STORE.hoursText}</span>. <Link href="/appointment?kind=store" className="link">Book a time</Link></dd>
            </div>
            <div>
              <dt className="font-display text-step-1">On a video call</dt>
              <dd className="mt-1 text-ink-muted">Each piece shown to the camera, from every side you ask. <Link href="/appointment?kind=video" className="link">Arrange a call</Link></dd>
            </div>
            <div>
              <dt className="font-display text-step-1">On WhatsApp</dt>
              <dd className="mt-1 text-ink-muted">Ask about a piece, or send a design to make in {STORE.madeToOrderDays}. <a href={whatsappLink('Hello Platera, I would like to ask about a piece.')} className="link">Message us</a></dd>
            </div>
          </dl>
        </Stop>
        <div className="h-[20svh]" />
      </div>
    </>
  )
}
