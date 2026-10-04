import Link from 'next/link'
import { Ledger } from '@/components/ledger/Ledger'
import { PieceImage } from '@/components/media/PieceImage'
import { MetalRule } from '@/components/metal/LightSource'
import { RateNote } from '@/components/site/RateNote'
import { WorldStation } from '@/components/world/WorldStation'
import type { Alcove } from '@/components/world/store'
import { getCategories, getCurrentRates, getSetting, listProducts, priceProduct } from '@/lib/catalogue'
import { STORE, whatsappLink } from '@/lib/store'
import { toPieceRef } from '@/lib/world-data'

export const revalidate = 300

type Hero = { productSku: string; heading: string; body: string }

/**
 * The home page is a walk through the house. Each section below is one stop for the
 * camera (data-world-section). The words sit over the 3D scene; every piece shown on
 * a tray is also a real link in the HTML, so nothing depends on the 3D to be reached.
 */
export default async function HomePage() {
  const [rates, products, categories, hero] = await Promise.all([
    getCurrentRates(),
    listProducts(),
    getCategories(),
    getSetting('hero') as Promise<Hero | null>,
  ])

  const rooms = categories
    .filter((c) => c._count.products > 0)
    .map((c) => {
      const inRoom = products.filter((p) => p.categoryId === c.id)
      const ordered = [...inRoom.filter((p) => p.featured), ...inRoom.filter((p) => !p.featured)]
      return { category: c, products: ordered }
    })

  const alcoves: Alcove[] = rooms.map((r) => ({
    slug: r.category.slug,
    name: r.category.name,
    pieces: r.products
      .slice(0, 4)
      .map((p) => toPieceRef(p, priceProduct(p, rates)))
      .filter((x): x is NonNullable<typeof x> => x !== null),
  }))

  const bookPiece = products.find((p) => p.sku === hero?.productSku) ?? products[0]
  const bookPricing = bookPiece ? priceProduct(bookPiece, rates) : null
  const silver = rates.SILVER_925

  return (
    <>
      <WorldStation station={{ kind: 'home', alcoves }} />

      {/* 0 · The entrance */}
      <section data-world-section="0" className="over-world relative min-h-[135svh]">
        <div className="sticky top-0 mx-auto flex min-h-svh max-w-[1440px] flex-col justify-end px-[var(--gutter)] pb-[12svh]">
          <p className="text-step--1 text-ink-muted">{STORE.collaboration}</p>
          <h1 className="mt-4 max-w-[12ch] text-step-6">{hero?.heading ?? 'Enter the House of Platera.'}</h1>
          <p className="measure mt-5 text-step-1 text-ink-muted">{hero?.body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#rooms" className="btn btn-primary">Walk through the house</Link>
            <Link href="/appointment" className="btn btn-quiet">Book a viewing</Link>
          </div>
          <RateNote rate={silver} className="mt-7" />
          {/* Without WebGL, the emblem's place is taken by a photograph of a real piece. */}
          <noscript>
            {bookPiece?.images[0] && <PieceImage image={bookPiece.images[0]} sizes="100vw" />}
          </noscript>
        </div>
      </section>

      {/* 1 · The corridor opens: why these pieces */}
      <section data-world-section="1" className="over-world relative min-h-[120svh]">
        <div className="sticky top-0 mx-auto flex min-h-svh max-w-[1440px] items-center px-[var(--gutter)]">
          <div className="ml-auto max-w-md">
            <h2 className="text-step-5">We don’t make jewellery. We choose it.</h2>
            <p className="mt-5 text-step-1 text-ink-muted">
              Every piece in the house is 925 sterling silver, hallmarked, selected with Bhairav Jewellers in Gorai 1 for its
              quality, craftsmanship and design, and weighed before it is priced.
            </p>
            <Link href="/about" className="link mt-6 inline-block">How Platera works</Link>
          </div>
        </div>
      </section>


      {/* 2 · The Hallmark Strike */}
      <section data-world-section="2" className="over-world relative min-h-[130svh]" aria-labelledby="hallmark-heading">
        <div className="sticky top-0 mx-auto flex min-h-svh max-w-[1440px] items-end px-[var(--gutter)] pb-[10svh] md:items-center md:justify-end md:pb-0">
          <div className="max-w-sm">
            <h2 id="hallmark-heading" className="text-step-5">The mark nobody can change</h2>
            <p className="mt-4 text-ink-muted">
              Every piece is struck with a BIS hallmark: 925 for sterling silver, certified by an independent assaying centre. It is the one
              thing on a piece of jewellery that the seller can’t make up.
            </p>
            <Link href="/hallmark" className="link mt-5 inline-block">How to read and check a hallmark</Link>
          </div>
        </div>
      </section>

      {/* 3 · The Stone Room */}
      <section data-world-section="3" className="over-world relative min-h-[150svh]" aria-labelledby="stone-heading">
        <div className="sticky top-0 mx-auto flex min-h-svh max-w-[1440px] items-end px-[var(--gutter)] pb-[10svh] md:items-center md:pb-0">
          <div className="max-w-sm">
            <h2 id="stone-heading" className="text-step-5">What a white stone is</h2>
            <p className="mt-4 text-ink-muted">
              Most of our white stones are cubic zirconia: made in a laboratory, cut like a diamond, and bright with the same flashes of
              colour. It is not a diamond, and we never call it one. Every piece says exactly which stones it carries.
            </p>
            <p className="mt-4 text-step--1 text-ink-muted">Scroll to turn the stone.</p>
          </div>
        </div>
      </section>

      {/* 4… · One alcove per collection */}
      <div id="rooms">
        {rooms.map((room, k) => {
          const textRight = k % 2 === 0 // the tray stands on the left, so the words go right
          return (
            <section key={room.category.id} data-world-section={String(4 + k)} className="over-world relative min-h-[130svh]" aria-labelledby={`room-${room.category.slug}`}>
              <div className={`sticky top-0 mx-auto flex min-h-svh max-w-[1440px] items-end px-[var(--gutter)] pb-[10svh] md:items-center md:pb-0 ${textRight ? 'md:justify-end' : ''}`}>
                <div className="max-w-sm">
                  <p className="num text-step--1 text-ink-muted">{room.products.length} {room.products.length === 1 ? 'piece' : 'pieces'}</p>
                  <h2 id={`room-${room.category.slug}`} className="mt-2 text-step-5">{room.category.name}</h2>
                  <p className="mt-4 text-ink-muted">{room.category.summary}</p>
                  <ul className="mt-5 space-y-1 text-step--1">
                    {room.products.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link href={`/piece/${p.slug}`} className="hover:text-argent">{p.name}</Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/${room.category.slug}`} className="btn btn-quiet mt-7">Enter the {room.category.name.toLowerCase()} room</Link>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* Last stop · The counter */}
      <section data-world-section={String(4 + rooms.length)} className="over-world relative min-h-[120svh]">
        <div className="sticky top-0 mx-auto flex min-h-svh max-w-[1440px] flex-col justify-end px-[var(--gutter)] pb-[12svh]">
          <h2 className="max-w-[14ch] text-step-5">See it in your hand before you decide.</h2>
          <div className="mt-8 grid max-w-4xl gap-8 sm:grid-cols-3">
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

      {/* The book, on a calm ground */}
      {bookPiece && bookPricing?.state === 'PRICED' && (
        <section aria-labelledby="ledger-heading" className="ground-solid">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] py-32 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 id="ledger-heading" className="text-step-5">The book, open</h2>
              <p className="measure mt-6 text-ink-muted">
                A good jeweller shows you the working. Every piece in the house carries its own breakdown: weight, rate, making, tax.
                Here is the one for the {bookPiece.name}.
              </p>
              {bookPiece.images[0] && <div className="mt-8 max-w-xs"><PieceImage image={bookPiece.images[0]} sizes="20rem" /></div>}
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <Ledger breakdown={bookPricing.breakdown} title={bookPiece.name} compact />
              <MetalRule className="mt-10" />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
