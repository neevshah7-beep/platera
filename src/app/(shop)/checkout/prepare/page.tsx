import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { mediaBase } from '@/components/media/PieceImage'
import { getCurrentRates } from '@/lib/catalogue'
import { getPricedBag } from '@/lib/cart/bag'
import { formatINR } from '@/lib/pricing/format'
import maps from '@/data/maps-manifest.json'
import { Prepare } from '@/scenes/ceremony/Prepare'

export const metadata: Metadata = { title: 'Prepared for you', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** Between the bag and checkout: the pieces are packed and the box wrapped, then on to pay. */
export default async function PreparePage() {
  const bag = await getPricedBag(await getCurrentRates())
  if (!bag.lines.length) redirect('/bag')
  if (bag.changed || bag.blocked) redirect('/bag?changed=1')
  const pieces = bag.lines.flatMap((l) => {
    const img = l.product.images.find((i) => i.kind === 'PHOTO')
    if (!img) return []
    const key = img.src.split('/').pop() ?? ''
    return [{ base: mediaBase(img.src), width: img.width, height: img.height, maps: Boolean((maps as Record<string, { maps?: boolean }>)[key]?.maps) }]
  })
  return (
    <>
      <Prepare pieces={pieces} names={bag.lines.map((l) => l.product.name)} total={formatINR(bag.totalPaise)} />
      <div className="h-[calc(100svh-4rem)]" aria-hidden />
    </>
  )
}
