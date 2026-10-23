"""One-off: passes the studio images (studioFor) through to the Viewing and the piece page."""
import re

def edit(path, pairs):
    s = open(path, encoding='utf8').read()
    for a, b in pairs:
        assert a in s, (path, a[:60])
        s = s.replace(a, b)
    open(path, 'w', encoding='utf8').write(s)

# The Viewing: studio images first, then the store photographs, then the cut-out.
edit('src/site/Viewing.tsx', [
    ("export type ViewingPiece = { slug: string; name: string; price: string; href: string; cutout: string; photos: string[]; productId?: string; start?: number }",
     "export type ViewingPiece = { slug: string; name: string; price: string; href: string; cutout: string; photos: string[]; studio?: string[]; productId?: string; start?: number }"),
    ("  const photos = [...piece.photos.map((p) => ({ src: `${p}-1600.webp`, thumb: `${p}-800.webp`, label: 'As photographed at the store' })), { src: `${piece.cutout}-1600.webp`, thumb: `${piece.cutout}-960.webp`, label: 'The piece, on its own' }]",
     "  const photos = [\n    ...(piece.studio ?? []).map((p) => ({ src: `${p}-1600.webp`, thumb: `${p}-800.webp`, label: 'Studio image' })),\n    ...piece.photos.map((p) => ({ src: `${p}-1600.webp`, thumb: `${p}-800.webp`, label: 'As photographed at the store' })),\n    { src: `${piece.cutout}-1600.webp`, thumb: `${piece.cutout}-960.webp`, label: 'The piece, on its own' },\n  ]"),
    ('<p className="viewing-note">Every photograph here is as taken at our counter in Gorai 1. Move over a photograph to look through the loupe.</p>',
     '<p className="viewing-note">{piece.studio?.length ? (piece.photos.length ? \'Studio images are made from our photographs to show the design clearly; store photographs are as taken at our counter in Gorai 1. \' : \'Studio images, made from our photographs to show the design clearly. \') : \'Every photograph here is as taken at our counter in Gorai 1. \'}Move over a photograph to look through the loupe.</p>'),
])

# The collection rooms: pass the studio images with each piece.
edit('src/scenes/collection/collection.ts', [
    ("originals?: string[]; productId?: string }", "originals?: string[]; studio?: string[]; productId?: string }"),
])
edit('src/scenes/collection/CollectionScene.tsx', [
    ("photos: piece.originals ?? [], productId", "photos: piece.originals ?? [], studio: piece.studio, productId"),
])
for p in ['src/app/(shop)/collection/page.tsx', 'src/app/(shop)/page.tsx', 'src/app/(shop)/[category]/page.tsx']:
    edit(p, [
        ("import { originalsFor } from '@/lib/originals'", "import { originalsFor, studioFor } from '@/lib/originals'"),
        ("originals: originalsFor(p.sku), productId", "originals: originalsFor(p.sku), studio: studioFor(p.sku), productId"),
    ])

# The piece page: a studio gallery (when there are studio images), and the store
# photographs only when there are any.
P = 'src/app/(shop)/piece/[slug]/page.tsx'
edit(P, [
    ("import { originalsFor } from '@/lib/originals'", "import { originalsFor, studioFor } from '@/lib/originals'"),
    ("cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku) }} />}",
     "cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />}"),
    ("""      {/* I · The originals: the store photographs, large, on an espresso wall. */}
      {pieceRef && (
        <section id="originals" aria-labelledby="originals-heading" className="orig">""",
     """      {/* I · The studio images, when the piece has them: always labelled as studio images. */}
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
      {pieceRef && originalsFor(product.sku).length > 0 && (
        <section id="originals" aria-labelledby="originals-heading" className="orig">"""),
    ("            <Originals piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku) }} />",
     "            <Originals piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />"),
])
print('ok')
