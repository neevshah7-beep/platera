import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { mediaBase } from '@/components/media/PieceImage'
import { getProduct, isSold } from '@/lib/catalogue'
import maps from '@/data/maps-manifest.json'
import { buyOnWhatsApp } from '@/lib/whatsapp'
import { Prepare } from '@/scenes/ceremony/Prepare'

export const metadata: Metadata = { title: 'Prepared for you', robots: { index: false, follow: false } }

/**
 * Buying a piece: it is laid in its case and packed for the journey, then sent to the
 * counter on WhatsApp, where the price is confirmed and the sale is made.
 */
export default async function BuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  if (isSold(product)) redirect(`/piece/${product.slug}`)
  const img = product.images.find((i) => i.kind === 'PHOTO')
  const key = img?.src.split('/').pop() ?? ''
  const pieces = img ? [{ base: mediaBase(img.src), width: img.width, height: img.height, maps: Boolean((maps as Record<string, { maps?: boolean }>)[key]?.maps) }] : []
  return (
    <>
      <Prepare pieces={pieces} names={[product.name]} send={buyOnWhatsApp(product)} back={`/piece/${product.slug}`} />
      <div className="h-[calc(100svh-4rem)]" aria-hidden />
    </>
  )
}
