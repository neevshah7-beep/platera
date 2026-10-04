import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ledger } from '@/components/ledger/Ledger'
import { PieceImage } from '@/components/media/PieceImage'
import { MetalRule } from '@/components/metal/LightSource'
import { BagButtons } from '@/components/pdp/BagButtons'
import { HallmarkPlate } from '@/components/pdp/HallmarkPlate'
import { StickyActions } from '@/components/pdp/StickyActions'
import { RateNote } from '@/components/site/RateNote'
import { PieceCard } from '@/components/tray/PieceCard'
import { STONE_LABEL, getCurrentRates, getProduct, isSold, listProducts, metalLine, priceProduct } from '@/lib/catalogue'
import { formatGrams, formatINRWhole } from '@/lib/pricing/format'
import { JsonLd, breadcrumbJsonLd, productJsonLd } from '@/lib/seo/jsonld'
import { STORE, siteUrl, whatsappLink } from '@/lib/store'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ unavailable?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) return {}
  const rates = await getCurrentRates()
  const pricing = priceProduct(p, rates)
  const price = pricing.state === 'PRICED' ? ` · ${formatINRWhole(pricing.breakdown.totalPaise)}` : ''
  const title = p.seoTitle ?? `${p.name} in 925 Silver${price}`
  const description =
    p.seoDescription ??
    `${p.summary} Hallmarked 925 sterling silver${p.netWeightMg && p.weightVerified ? `, ${formatGrams(p.netWeightMg)}` : ''}, priced openly by weight. From Gorai 1, Borivali West.`
  const image = p.images[0]
  return {
    title,
    description: description.slice(0, 155),
    alternates: { canonical: `/piece/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `/piece/${p.slug}`,
      images: image ? [{ url: `/media/${image.src}-1600.webp`, width: 1600, alt: image.alt }] : undefined,
    },
  }
}

export default async function PiecePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { unavailable } = await searchParams
  const product = await getProduct(slug)
  if (!product) notFound()

  const rates = await getCurrentRates()
  const pricing = priceProduct(product, rates)
  const sold = isSold(product)
  const metal = product.finish?.toLowerCase().includes('gold') ? 'champagne' : 'argent'
  const priced = pricing.state === 'PRICED'
  const oneOfOne = product.stock === 1 && product.availability === 'IN_STOCK'

  const related = (await listProducts({ category: product.category.slug }))
    .filter((p) => p.id !== product.id)
    .slice(0, 3)
    .map((p) => ({ product: p, pricing: priceProduct(p, rates) }))

  const enquiry = whatsappLink(
    `Hello Platera, I'd like to ask about the ${product.name} (${product.sku}).\n${siteUrl(`/piece/${product.slug}`)}`,
  )

  const specs: [string, React.ReactNode][] = [
    ['Reference', product.sku],
    ['Category', product.category.name],
    ['Metal', metalLine(product)],
    ['Purity', '925 (92.5% pure silver)'],
    ['Net weight', product.netWeightMg && product.weightVerified ? formatGrams(product.netWeightMg) : 'Being weighed'],
    ['Gross weight', product.grossWeightMg && product.weightVerified ? formatGrams(product.grossWeightMg) : 'Being weighed'],
    ['Weight tolerance', 'None. The weight shown is the weight of this piece.'],
    ['Stones', STONE_LABEL[product.stoneType]],
    ...(product.stoneDetails ? ([['Stone details', product.stoneDetails]] as [string, string][]) : []),
    ['Hallmark', product.hallmarked ? `BIS hallmarked, 925${product.huid ? `, HUID ${product.huid}` : ''}` : 'Not hallmarked'],
    ...(product.lengthInches ? ([['Length', `${product.lengthInches.toString()} in`]] as [string, string][]) : []),
    ...(product.dimensions ? ([['Dimensions', product.dimensions]] as [string, string][]) : []),
    ['Availability', sold ? 'Sold' : product.availability === 'MADE_TO_ORDER' ? `Made to order, ${product.leadTimeDays ?? STORE.madeToOrderDays}` : oneOfOne ? 'One piece in stock' : `${product.stock} in stock`],
  ]

  return (
    <>
      <JsonLd data={productJsonLd(product, pricing, sold)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: product.category.name, path: `/${product.category.slug}` },
          { name: product.name, path: `/piece/${product.slug}` },
        ])}
      />

      <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-6">
        <nav aria-label="Breadcrumb" className="text-step--1 text-ink-muted">
          <ol className="flex gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
            <li><Link href={`/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link> /</li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* The Lamp: the piece, lit. Phase 2 adds the turntable and the movable light. */}
      <div className="mx-auto grid max-w-[1440px] gap-10 px-[var(--gutter)] pt-6 lg:grid-cols-12">
        <section aria-label="Photographs" className="lg:col-span-7">
          <ul className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:grid lg:gap-6 lg:overflow-visible lg:px-0">
            {product.images.map((image, i) => (
              <li key={image.id} className="w-[86vw] shrink-0 snap-center lg:w-auto">
                <PieceImage image={image} sizes="(min-width: 1024px) 56vw, 86vw" priority={i === 0} />
              </li>
            ))}
          </ul>
          {product.images.length > 1 && (
            <p className="mt-3 text-step--1 text-ink-muted lg:hidden">Swipe for {product.images.length - 1} more {product.images.length === 2 ? 'view' : 'views'}</p>
          )}
        </section>

        <section aria-labelledby="piece-name" className="lg:col-span-5 lg:col-start-8">
          <div className="lg:sticky lg:top-24">
            <p className="text-step--1 text-ink-muted">{metalLine(product)}</p>
            <h1 id="piece-name" className="mt-2 text-step-5">{product.name}</h1>
            <p className="measure mt-5 text-step-1 text-ink-muted">{product.summary}</p>

            <div className="mt-8">
              {sold ? (
                <p className="font-display text-step-3">Sold</p>
              ) : priced ? (
                <>
                  <p className="num font-display text-step-4">{formatINRWhole(pricing.breakdown.totalPaise)}</p>
                  <p className="mt-1 text-step--1 text-ink-muted">GST included. <a href="#ledger" className="link">See how it’s priced</a></p>
                  <RateNote rate={pricing.breakdown.rate} className="mt-1" />
                </>
              ) : (
                <>
                  <p className="font-display text-step-3">Priced once weighed</p>
                  <p className="measure mt-2 text-ink-muted">
                    We’re weighing this piece before it goes on sale, so the price will be exact. Ask us on WhatsApp and we’ll
                    send you the weight and today’s price.
                  </p>
                </>
              )}
            </div>

            {product.stoneType === 'CUBIC_ZIRCONIA' && (
              <p className="mt-6 border-l border-argent pl-4 text-step-0">Set with cubic zirconia (CZ), a lab-made stone. Not diamond.</p>
            )}
            {oneOfOne && !sold && <p className="mt-4 text-step--1 text-ink-muted">One of one. There is only this piece.</p>}

            <div className="mt-8" id="actions">
              {unavailable && (
                <p role="alert" className="mb-4 text-step--1 text-garnet-bright">That piece couldn’t be added. It may have just sold, or it is still being weighed.</p>
              )}
              {!sold && priced && <BagButtons productId={product.id} />}
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <a href={enquiry} className="btn btn-quiet">Enquire on WhatsApp</a>
                <Link href={`/appointment?piece=${product.slug}`} className="btn btn-quiet">Book a viewing</Link>
              </div>
              {sold && (
                <p className="mt-6 text-ink-muted">
                  This piece has found its home. <a className="link text-ink" href={whatsappLink(`Hello Platera, the ${product.name} (${product.sku}) has sold. Could you tell me when something similar arrives, or make one like it?`)}>Ask us to find or make something like it</a>.
                </p>
              )}
            </div>

            <p className="mt-8 text-step--1 text-ink-muted">
              Delivery across India by courier, prepaid. Returns within {STORE.returnWindowDays} days under our{' '}
              <Link href="/policies/returns" className="link">returns policy</Link>; making charges and GST are not refundable.
              {product.returnNote ? ` ${product.returnNote}` : ''}
            </p>
          </div>
        </section>
      </div>

      <StickyActions productId={product.id} name={product.name} price={priced && !sold ? formatINRWhole(pricing.breakdown.totalPaise) : null} enquiry={enquiry} />

      {/* The Ledger: the book, open. */}
      <section id="ledger" aria-label="Price, weight and certification" className="mx-auto mt-28 grid max-w-[1440px] gap-16 px-[var(--gutter)] lg:grid-cols-12">
        <div className="lg:col-span-6">
          {priced ? (
            <Ledger breakdown={pricing.breakdown} metal={metal} />
          ) : (
            <div>
              <h2 className="text-step-3">How this price will be made</h2>
              <p className="measure mt-4 text-ink-muted">
                Once weighed, this piece is priced as: net weight × today’s 925 silver rate, plus a making charge of{' '}
                {product.makingPct ?? 15}% of the metal value, plus 3% GST. Every line will be shown here.
              </p>
            </div>
          )}
          <div className="mt-14">
            <h2 className="text-step-3">The hallmark</h2>
            <div className="mt-6"><HallmarkPlate purity="925" huid={product.huid} metal={metal} /></div>
            <p className="measure mt-5 text-ink-muted">
              The Bureau of Indian Standards hallmark is stamped on the piece itself and certifies its purity: 925 means 92.5% pure silver.
              Where a piece carries a six-character HUID, you can check it yourself in the government’s BIS CARE app.
              <Link href="/hallmark" className="link ml-1 text-ink">How to read a hallmark</Link>
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <h2 className="text-step-3">Specifications</h2>
          <dl className="mt-6">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-t border-rule py-3 text-step--1 sm:grid-cols-[11rem_1fr]">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="measure mt-8">{product.description}</p>
          <p className="mt-6 text-step--1">
            <Link href="/size-guide" className="link">Size guide: chain, necklace and payal lengths</Link>
          </p>
          <div className="mt-10 border-t border-rule pt-6">
            <h3 className="text-step-2">Something like this, made for you</h3>
            <p className="measure mt-2 text-ink-muted">
              Send us a design or a reference and we’ll confirm the price before anything is made. Made-to-order pieces take {STORE.madeToOrderDays}.
            </p>
            <a className="link mt-3 inline-block" href={whatsappLink(`Hello Platera, I'd like something made to order, similar to the ${product.name} (${product.sku}).`)}>
              Start a custom order on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto mt-32 max-w-[1440px] px-[var(--gutter)]">
          <MetalRule metal={metal} />
          <h2 id="related-heading" className="mt-12 text-step-4">Also on the tray</h2>
          <ul className="mt-12 grid gap-12 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.product.id}>
                <PieceCard product={r.product} pricing={r.pricing} sizes="(min-width: 640px) 30vw, 90vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
