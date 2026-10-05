import type { Pricing, ProductWithMedia } from '@/lib/catalogue'
import { PieceCard } from './PieceCard'

/*
 * The Tray. Pieces are set down at different sizes and heights, the way a jeweller
 * lays out a tray, rather than in identical cells. The rhythm repeats every six
 * pieces so the page stays orderly as the catalogue grows.
 *
 * Desktop: a 12-column grid. Each slot has a column span, a start and a vertical offset.
 * Phone: one column, alternating a wide piece on the left and a narrower one on the right.
 */
const SLOTS = [
  { cls: 'md:col-start-1 md:col-span-6', sizes: '(min-width: 768px) 46vw, 88vw' },
  { cls: 'md:col-start-8 md:col-span-4 md:mt-[22vh]', sizes: '(min-width: 768px) 30vw, 72vw' },
  { cls: 'md:col-start-2 md:col-span-4 md:-mt-[6vh]', sizes: '(min-width: 768px) 30vw, 88vw' },
  { cls: 'md:col-start-7 md:col-span-6 md:mt-[10vh]', sizes: '(min-width: 768px) 46vw, 72vw' },
  { cls: 'md:col-start-1 md:col-span-5 md:mt-[4vh]', sizes: '(min-width: 768px) 38vw, 88vw' },
  { cls: 'md:col-start-8 md:col-span-5 md:mt-[18vh]', sizes: '(min-width: 768px) 38vw, 72vw' },
] as const

export function Tray({
  items,
  priorityFirst = false,
  label,
}: {
  items: { product: ProductWithMedia; pricing: Pricing }[]
  priorityFirst?: boolean
  label: string
}) {
  return (
    <ul aria-label={label} className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-[var(--gutter)] md:gap-y-24">
      {items.map(({ product, pricing }, i) => {
        const slot = SLOTS[i % SLOTS.length]
        const mobile = i % 2 === 0 ? 'w-[88%]' : 'ml-auto w-[72%]'
        return (
          <li key={product.id} className={`${mobile} md:ml-0 md:w-auto ${slot.cls}`}>
            <PieceCard product={product} pricing={pricing} sizes={slot.sizes} priority={priorityFirst && i === 0} />
          </li>
        )
      })}
    </ul>
  )
}
