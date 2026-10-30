"""One-off: rings, pendants and bangles shown in their photographs (no 3D)."""
def edit(p, pairs):
    s = open(p, encoding='utf8').read()
    for a, b in pairs:
        assert a in s, (p, a[:90]); s = s.replace(a, b)
    open(p, 'w', encoding='utf8').write(s)

# The tray grid: photographs fill their mat.
edit('src/components/tray/PieceGrid.tsx', [
    ("import { isSold, metalLine, type Pricing, type ProductWithMedia } from '@/lib/catalogue'",
     "import { isSold, metalLine, type Pricing, type ProductWithMedia } from '@/lib/catalogue'\nimport { isPhotoCategory } from '@/lib/photo-pieces'"),
    ('className="tray-card" data-sold={sold}>', 'className="tray-card" data-sold={sold} data-photo={isPhotoCategory(product.category.slug)}>'),
])

# The 3D case rooms (home, collection) leave out pieces shown only in photographs.
for p in ['src/app/(shop)/page.tsx', 'src/app/(shop)/collection/page.tsx']:
    s = open(p, encoding='utf8').read()
    s = s.replace("import { originalsFor, studioFor } from '@/lib/originals'", "import { originalsFor, studioFor } from '@/lib/originals'\nimport { isPhotoCategory } from '@/lib/photo-pieces'", 1)
    open(p, 'w', encoding='utf8').write(s)

# The room page.
P = 'src/app/(shop)/[category]/page.tsx'
edit(P, [
    ("import { originalsFor, studioFor } from '@/lib/originals'",
     "import { originalsFor, studioFor } from '@/lib/originals'\nimport { isPhotoCategory, ringGroup } from '@/lib/photo-pieces'\nimport { PhotoRoom, type PhotoPiece } from '@/components/tray/PhotoRoom'\nimport { PRICE_ON_REQUEST } from '@/lib/whatsapp'"),
    ("type Props = {", """/** Every piece of a photograph room (rings, pendants, bangles), for the tap-to-view grid. */
function photoPieces(products: Awaited<ReturnType<typeof listProducts>>): PhotoPiece[] {
  return products.flatMap((p) => {
    const img = p.images[0]
    if (!img) return []
    const sold = isSold(p)
    return [{ slug: p.slug, name: p.name, price: PRICE_ON_REQUEST, href: `/piece/${p.slug}`, base: mediaBase(img.src), alt: img.alt, photos: originalsFor(p.sku), studio: studioFor(p.sku), group: ringGroup(p.sku), sold, productId: sold ? undefined : p.id }]
  })
}

type Props = {"""),
    ("""  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />""",
     """  if (isPhotoCategory(c.slug)) {
    // Shown in their photographs: no 3D room, a grid of prints to tap and look closer.
    return (
      <>
        <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />
        <JsonLd data={itemListJsonLd(c.name, `/${c.slug}`, products)} />
        <div id="list" className="relative bg-cream">
          <div className="mx-auto max-w-[1440px] px-[var(--gutter)]">
            <header className="room-head">
              <p className="eyebrow">{c.name}</p>
              <h1 className="room-title">{c.seoTitle.split('|')[0].trim()}</h1>
              <p className="room-lede">{c.summary} Tap any piece to look closer, see every photograph, and ask for it on WhatsApp.</p>
            </header>
            <PhotoRoom pieces={photoPieces(products)} label={c.name} />
            <section aria-labelledby="guide-heading" className="mt-32 grid gap-10 border-t border-rule pt-12 pb-8 md:grid-cols-12">
              <h2 id="guide-heading" className="text-step-4 md:col-span-4">Buying {c.name.toLowerCase()}: what to look for</h2>
              <div className="measure space-y-5 text-ink-muted md:col-span-7 md:col-start-6">
                {c.guide.split(/\\n\\n+/).map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}` }])} />"""),
])
print('ok')
