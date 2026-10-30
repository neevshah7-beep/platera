p='src/app/(shop)/piece/[slug]/page.tsx'; s=open(p,encoding='utf8').read()
def rep(a,b):
    global s
    assert a in s, a[:80]; s=s.replace(a,b)
rep("import { PieceLamp } from '@/scenes/lamp/PieceLamp'", "import { PieceLamp } from '@/scenes/lamp/PieceLamp'\nimport { PhotoStage } from '@/components/pdp/PhotoStage'\nimport { isPhotoCategory } from '@/lib/photo-pieces'")
rep("""          {pieceRef && product.images[0] ? (
            <PieceLamp""", """          {pieceRef && product.images[0] && isPhotoCategory(product.category.slug) ? (
            // Shown in its photographs: no lamp, no cut-out.
            <PhotoStage main={mediaBase(product.images[0].src)} alt={product.images[0].alt} piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku), plain: true }} />
          ) : pieceRef && product.images[0] ? (
            <PieceLamp""")
rep("""            {pieceRef && <ViewButton piece={{""", """            {pieceRef && !isPhotoCategory(product.category.slug) && <ViewButton piece={{""")
# Galleries below: no cut-out tile for photo pieces.
s = s.replace("studio: studioFor(product.sku) }} />\n          </div>\n        </section>\n      )}\n\n      {/* II · The originals", "studio: studioFor(product.sku), plain: isPhotoCategory(product.category.slug) }} />\n          </div>\n        </section>\n      )}\n\n      {/* II · The originals",1)
rep("""            <Originals piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku) }} />""",
"""            <Originals piece={{ slug: product.slug, name: product.name, price: sold ? 'Sold' : PRICE_ON_REQUEST, href: `/piece/${product.slug}`, cutout: mediaBase(pieceRef.src), photos: originalsFor(product.sku), studio: studioFor(product.sku), plain: isPhotoCategory(product.category.slug) }} />""")
rep("...(['rings', 'pendants'].includes(product.category.slug) ? [] :", "...(['rings', 'pendants', 'bangles'].includes(product.category.slug) ? [] :")
open(p,'w',encoding='utf8').write(s); print(s.count('plain: isPhotoCategory'))
