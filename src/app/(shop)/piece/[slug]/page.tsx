import type { Metadata } from 'next'
import { social } from '@/lib/seo/meta'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PieceImage } from '@/components/media/PieceImage'
import { BuyButtons } from '@/components/pdp/BuyButtons'
import { Certificate } from '@/components/pdp/Certificate'
import { Originals } from '@/components/pdp/Originals'
import { StickyActions } from '@/components/pdp/StickyActions'
import { mediaBase } from '@/components/media/PieceImage'
import { PieceLamp } from '@/scenes/lamp/PieceLamp'
import { originalsFor, studioFor } from '@/lib/originals'
import { ViewButton } from '@/site/ViewButton'
import maps from '@/data/maps-manifest.json'
import { toPieceRef } from '@/lib/world-data'
import { STONE_LABEL, getProduct, isSold, listProducts, metalLine } from '@/lib/catalogue'
import { formatGrams } from '@/lib/pricing/format'
import { PRICE_ON_REQUEST, priceOnWhatsApp } from '@/lib/whatsapp'
import { JsonLd, breadcrumbJsonLd, productJsonLd } from '@/lib/seo/jsonld'
import { STORE, siteUrl, whatsappLink } from '@/lib/store'

export const revalidate = 300


type Props = { params: Promise<{ slug: string }> }

/** Every piece is built ahead of time and refreshed every five minutes, so it opens at once. */
export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) return {}
  const title = p.seoTitle ?? `${p.name} in 925 Silver`
  const description =
    p.seoDescription ??
    `${p.summary} Hallmarked 925 sterling silver${p.netWeightMg && p.weightVerified ? `, ${formatGrams(p.netWeightMg)}` : ''}. Buy or ask the price on WhatsApp. From Gorai 1, Borivali West.`
  const image = p.images[0]
  return social({
    title,
    description: description.length > 158 ? `${description.slice(0, 157).replace(/\s+\S*$/, '')}…` : description,
    alternates: { canonical: `/piece/${p.slug}` },
    openGraph: image ? { images: [{ url: `/og/${p.slug}`, width: 1200, height: 630, alt: image.alt, type: 'image/jpeg' }] } : undefined,
  })
}

export default async function PiecePage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const sold = isSold(product)
  const oneOfOne = product.stock === 1 && product.availability === 'IN_STOCK'
  const pieceRef = toPieceRef(product)

  const related = (await listProducts({ category: product.category.slug }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map((p) => ({ product: p }))

  const ask = priceOnWhatsApp(product)
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
    // Rings and pendants are listed without a stone description, at the owner's request.
    ...(['rings', 'pendants'].includes(product.category.slug) ? [] : ([['Stones', STONE_LABEL[product.stoneType]]] as [string, string][])),
    ...(product.stoneDetails ? ([['Stone details', product.stoneDetails]] as [string, string][]) : []),
    ['Hallmark', product.hallmarked ? `BIS hallmarked, 925${product.huid ? `, HUID ${product.huid}` : ''}` : 'Not hallmarked'],
    ...(product.lengthInches ? ([['Length', `${product.lengthInches.toString()} in`]] as [string, string][]) : []),
    ...(product.dimensions ? ([['Dimensions', product.dimensions]] as [string, string][]) : []),
    ['Availability', sold ? 'Sold' : product.availability === 'MADE_TO_ORDER' ? `Made to order, ${product.leadTimeDays ?? STORE.madeToOrderDays}` : oneOfOne ? 'One piece in stock' : `${product.stock} in stock`],
  ]

  return (
    <>
      <JsonLd data={productJsonLd(product, sold)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: product.category.name, path: `/${product.category.slug}` },
          { name: product.name, path: `/piece/${product.slug}` },
        ])}
      />

      <div className="mx-auto max-w-[1440px] px-[var(--gutter)] pt-6">
        <nav aria-label="Breadcrumb" className="pdp-crumbs">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            <li className="whitespace-nowrap"><Link href="/" className="hover:text-ink">Home</Link> /</li>
            <li className="whitespace-nowrap"><Link href={`/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link> /</li>
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
            {pieceRef && <ViewButton piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />}
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
              ) : (
                <>
                  <p className="font-display text-step-3">Price on WhatsApp</p>
                  <p className="measure mt-2 text-ink-muted">
                    Silver is priced by weight at the day’s rate. Ask and we send today’s price for this piece, with its working, in a minute or two.
                  </p>
                </>
              )}
            </div>

            {product.stoneType === 'CUBIC_ZIRCONIA' && (
              <p className="pdp-note">Set with cubic zirconia (CZ), a lab-made stone. Not diamond.</p>
            )}
            {oneOfOne && !sold && <p className="mt-4 text-step--1 text-ink-muted">One of one. There is only this piece.</p>}

            <div className="mt-8" id="actions">
              {!sold && <BuyButtons slug={product.slug} ask={ask} />}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <a href={enquiry} target="_blank" rel="noopener" className="btn btn-quiet">Ask a question</a>
                <Link href={`/appointment?piece=${product.slug}`} className="btn btn-quiet">Book a viewing</Link>
              </div>
              {sold && (
                <p className="mt-6 text-ink-muted">
                  This piece has found its home. <a className="link text-ink" href={whatsappLink(`Hello Platera, the ${product.name} (${product.sku}) has sold. Could you tell me when something similar arrives, or make one like it?`)}>Ask us to find or make something like it</a>.
                </p>
              )}
            </div>

            <p className="mt-8 text-step--1 text-ink-muted">
              Insured delivery across India, arranged on WhatsApp. Returns within {STORE.returnWindowDays} days under our{' '}
              <Link href="/policies/returns" className="link">returns policy</Link>; {Number(product.makingPct) > 0 ? 'making charges and GST are' : 'GST is'} not refundable.
              {product.returnNote ? ` ${product.returnNote}` : ''}
            </p>
          </div>
        </section>
      </div>


      <StickyActions slug={product.slug} name={product.name} sold={sold} ask={sold ? enquiry : ask} />

      {/* I · The studio images, when the piece has them: always labelled as studio images. */}
      {pieceRef && studioFor(product.sku).length > 0 && (
        <section id="studio" aria-labelledby="studio-heading" className="orig">
          <div className="orig-inner">
            <div className="orig-head">
              <p className="eyebrow">In the studio</p>
              <h2 id="studio-heading" className="orig-title">Every angle, <em className="accent">in studio light.</em></h2>
              <p className="orig-note">Studio images, made from our photographs to show the design clearly. The ring you receive is the one at our counter. Open any image to look through the loupe.</p>
            </div>
            <Originals kind="studio" piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />
          </div>
        </section>
      )}

      {/* II · The originals: the store photographs, large, on an espresso wall. */}
      {pieceRef && (originalsFor(product.sku).length > 0 || studioFor(product.sku).length === 0) && (
        <section id="originals" aria-labelledby="originals-heading" className="orig">
          <div className="orig-inner">
            <div className="orig-head">
              <p className="eyebrow">Unedited</p>
              <h2 id="originals-heading" className="orig-title">As photographed <em className="accent">at the counter.</em></h2>
              <p className="orig-note">Exactly as taken in Gorai 1: no retouching, no background removed. Open any photograph to look through the loupe.</p>
            </div>
            <Originals piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />
          </div>
        </section>
      )}

      {/* III · How to make it yours. */}
      <section id="ledger" aria-labelledby="how-heading" className="how-sec">
        <div className="price-head">
          <p className="eyebrow">On WhatsApp</p>
          <h2 id="how-heading" className="price-title">Three steps, <em className="accent">and it is yours.</em></h2>
        </div>
        <ol className="how-steps">
          <li><span className="how-n font-display">1</span><h3>Send us the piece</h3><p>Tap Buy on WhatsApp. The piece arrives at our counter with its photograph and reference.</p></li>
          <li><span className="how-n font-display">2</span><h3>We confirm the price</h3><p>Weighed at the counter and priced at the day’s silver rate,{Number(product.makingPct) > 0 ? ' with the making charge and GST shown.' : ' with GST shown.'}</p></li>
          <li><span className="how-n font-display">3</span><h3>Packed and sent</h3><p>Pay by UPI or bank transfer, or collect it at Gorai 1. We send it insured, anywhere in India.</p></li>
        </ol>
        {!sold && (
          <div className="how-cta">
            <BuyButtons slug={product.slug} ask={ask} />
          </div>
        )}
      </section>

      {/* IV · In the hand, and the certificate. */}
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
            {!['rings', 'pendants'].includes(product.category.slug) && <Link href="/size-guide" className="link">Size guide</Link>}
          </p>
        </div>
        <Certificate name={product.name} sku={product.sku} purity="925" huid={product.huid} specs={specs.map(([k, v]) => [k, String(v)] as [string, string])} />
      </section>

      {/* V · Made for you. */}
      <section aria-labelledby="bespoke-heading" className="bespoke">
        <div className="bespoke-inner">
          <p className="eyebrow">Made for you</p>
          <h2 id="bespoke-heading" className="bespoke-title">Something like this, <em className="accent">made to your hand.</em></h2>
          <p className="bespoke-body">Send us a design or a reference; we confirm the weight and the price before anything is made. Made-to-order pieces take {STORE.madeToOrderDays}.</p>
          <a className="btn btn-primary" href={whatsappLink(`Hello Platera, I'd like something made to order, similar to the ${product.name} (${product.sku}).`)}>Start a custom order</a>
        </div>
      </section>

      {/* VI · From the same tray. */}
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
                      <span className="tray-ask">{rsold ? 'Sold' : 'View'}</span>
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
