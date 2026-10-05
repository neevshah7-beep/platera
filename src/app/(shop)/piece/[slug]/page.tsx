import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PieceImage } from '@/components/media/PieceImage'
import { BagButtons } from '@/components/pdp/BagButtons'
import { Certificate } from '@/components/pdp/Certificate'
import { Originals } from '@/components/pdp/Originals'
import { PriceEquation } from '@/components/pdp/PriceEquation'
import { StickyActions } from '@/components/pdp/StickyActions'
import { RateNote } from '@/components/site/RateNote'
import { mediaBase } from '@/components/media/PieceImage'
import { PieceLamp } from '@/scenes/lamp/PieceLamp'
import { originalsFor } from '@/lib/originals'
import { ViewButton } from '@/site/ViewButton'
import maps from '@/data/maps-manifest.json'
import { toPieceRef } from '@/lib/world-data'
import { STONE_LABEL, getCurrentRates, getProduct, isSold, listProducts, metalLine, priceProduct } from '@/lib/catalogue'
import { formatGrams, formatINR, formatINRWhole } from '@/lib/pricing/format'
import { JsonLd, breadcrumbJsonLd, productJsonLd } from '@/lib/seo/jsonld'
import { STORE, mediaUrl, siteUrl, whatsappLink } from '@/lib/store'

export const revalidate = 300

const rateWhen = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

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
      images: image ? [{ url: mediaUrl(image.src), width: 1600, alt: image.alt }] : undefined,
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
  const metal = product.finish?.toLowerCase().includes('gold') ? 'gold' : 'argent'
  const priced = pricing.state === 'PRICED'
  const oneOfOne = product.stock === 1 && product.availability === 'IN_STOCK'
  const pieceRef = toPieceRef(product, pricing)

  const related = (await listProducts({ category: product.category.slug }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
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
        <nav aria-label="Breadcrumb" className="pdp-crumbs">
          <ol className="flex gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
            <li><Link href={`/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link> /</li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* The Lamp: the piece on a velvet pad. The visitor carries the light. */}
      <div className="mx-auto grid max-w-[1440px] gap-10 px-[var(--gutter)] pt-4 lg:grid-cols-12">
        <section aria-label="The piece under the lamp" className="lg:col-span-7">
          {pieceRef && product.images[0] ? (
            <PieceLamp
              slug={product.slug}
              base={mediaBase(pieceRef.src)}
              width={pieceRef.width}
              height={pieceRef.height}
              maps={Boolean((maps as Record<string, { maps?: boolean }>)[pieceRef.src.split('/').pop() ?? '']?.maps)}
              poster={<PieceImage image={product.images[0]} sizes="(min-width: 1024px) 56vw, 100vw" priority className="block h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-contain" />}
            />
          ) : null}
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-step--1">
            {pieceRef && <ViewButton piece={{ slug: product.slug, name: product.name, price: priced && !sold ? formatINRWhole(pricing.breakdown.totalPaise) : sold ? 'Sold' : 'Priced once weighed', href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), productId: !sold && priced ? product.id : undefined }} />}
            <a href="#originals" className="link">All photographs</a>
          </p>
        </section>

        <section aria-labelledby="piece-name" className="lg:col-span-5 lg:col-start-8">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow">{metalLine(product)}</p>
            <h1 id="piece-name" className="pdp-name">{product.name}</h1>
            <p className="measure mt-5 text-step-1 text-ink-muted">{product.summary}</p>

            <div className="pdp-price">
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
              <p className="pdp-note">Set with cubic zirconia (CZ), a lab-made stone. Not diamond.</p>
            )}
            {oneOfOne && !sold && <p className="mt-4 text-step--1 text-ink-muted">One of one. There is only this piece.</p>}

            <div className="mt-8" id="actions">
              {unavailable && (
                <p role="alert" className="mb-4 text-step--1 text-ruby-bright">That piece couldn’t be added. It may have just sold, or it is still being weighed.</p>
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

      {/* I · The originals: the store photographs, large, on an espresso wall. */}
      {pieceRef && (
        <section id="originals" aria-labelledby="originals-heading" className="orig">
          <div className="orig-inner">
            <div className="orig-head">
              <p className="eyebrow">Unedited</p>
              <h2 id="originals-heading" className="orig-title">As photographed <em className="accent">at the counter.</em></h2>
              <p className="orig-note">Exactly as taken in Gorai 1: no retouching, no background removed. Open any photograph to look through the loupe.</p>
            </div>
            <Originals piece={{ slug: product.slug, name: product.name, price: priced && !sold ? formatINRWhole(pricing.breakdown.totalPaise) : sold ? 'Sold' : 'Priced once weighed', href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), productId: !sold && priced ? product.id : undefined }} />
          </div>
        </section>
      )}

      {/* II · Weighed, then priced: the price as one equation. */}
      <section id="ledger" aria-labelledby="price-heading" className="price-sec">
        <div className="price-head">
          <p className="eyebrow">The working</p>
          <h2 id="price-heading" className="price-title">Weighed, <em className="accent">then priced.</em></h2>
          <p className="price-lede">
            {product.netWeightMg && product.weightVerified
              ? `This piece weighs ${formatGrams(product.netWeightMg)} of silver. That weight, at today’s rate, is where its price begins; every other line is shown beside it.`
              : 'Every piece is weighed before it is priced, and every line of the price is shown.'}
          </p>
        </div>
        {priced && pricing.state === 'PRICED' ? (
          <PriceEquation
            lines={pricing.breakdown.lines.map((l) => ({ key: l.key, label: l.label, detail: l.detail, paise: l.paise }))}
            totalPaise={pricing.breakdown.totalPaise}
            rateNote={pricing.breakdown.rate ? `925 silver ${formatINR(pricing.breakdown.rate.paisePerGram)} per g · rate as on ${rateWhen.format(pricing.breakdown.rate.effectiveAt)}` : undefined}
          />
        ) : (
          <p className="price-pending font-display">
            Net weight × today’s 925 silver rate, plus a making charge of {product.makingPct ?? 15}% of the metal value, plus 3% GST.
          </p>
        )}
        <p className="price-links">
          <Link href="/silver-rate-today" className="link">Today’s silver rate</Link>
          <Link href="/policies/returns" className="link">Returns and buyback</Link>
        </p>
      </section>

      {/* III · In the hand, and the certificate. */}
      <section aria-labelledby="hand-heading" className="cert-sec">
        <div className="cert-copy">
          <p className="eyebrow">In the hand</p>
          <h2 id="hand-heading" className="cert-title">About <em className="accent">this piece.</em></h2>
          <p className="cert-story">{product.description}</p>
          <p className="cert-hallmark">
            The hallmark is struck on the piece itself: 925 means 92.5% pure silver.
            {product.huid ? ' Its HUID can be checked in the government’s BIS CARE app.' : ''}
          </p>
          <p className="cert-links">
            <Link href="/hallmark" className="link">How to read a hallmark</Link>
            <Link href="/size-guide" className="link">Size guide</Link>
          </p>
        </div>
        <Certificate name={product.name} sku={product.sku} purity="925" huid={product.huid} specs={specs.map(([k, v]) => [k, String(v)] as [string, string])} />
      </section>

      {/* IV · Made for you. */}
      <section aria-labelledby="bespoke-heading" className="bespoke">
        <div className="bespoke-inner">
          <p className="eyebrow">Made for you</p>
          <h2 id="bespoke-heading" className="bespoke-title">Something like this, <em className="accent">made to your hand.</em></h2>
          <p className="bespoke-body">Send us a design or a reference; we confirm the weight and the price before anything is made. Made-to-order pieces take {STORE.madeToOrderDays}.</p>
          <a className="btn btn-primary" href={whatsappLink(`Hello Platera, I'd like something made to order, similar to the ${product.name} (${product.sku}).`)}>Start a custom order</a>
        </div>
      </section>

      {/* V · From the same tray. */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="tray-sec">
          <div className="tray-head">
            <h2 id="related-heading" className="tray-title">From the <em className="accent">same tray.</em></h2>
            <Link href={`/${product.category.slug}`} className="link">All {product.category.name.toLowerCase()}</Link>
          </div>
          <ul className="tray-grid">
            {related.map((r) => {
              const img = r.product.images[0]
              const rsold = isSold(r.product)
              return (
                <li key={r.product.id}>
                  <Link href={`/piece/${r.product.slug}`} className="tray-card">
                    <span className="tray-mat">{img && <PieceImage image={img} sizes="(min-width: 640px) 24vw, 90vw" fit="contain" className="tray-img" />}</span>
                    <span className="tray-name font-display">{r.product.name}</span>
                    <span className="tray-meta">
                      <span>{metalLine(r.product)}</span>
                      <span className="num">{rsold ? 'Sold' : r.pricing.state === 'PRICED' ? formatINRWhole(r.pricing.breakdown.totalPaise) : 'Priced once weighed'}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
