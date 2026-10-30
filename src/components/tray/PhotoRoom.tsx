'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Viewing, type ViewingPiece } from '@/site/Viewing'

export type PhotoPiece = {
  slug: string
  name: string
  price: string
  href: string
  /** Base URL of the framed main photograph (-480/-960/-1600 .webp/.avif). */
  base: string
  alt: string
  photos: string[]
  studio: string[]
  group: string | null
  sold: boolean
  productId?: string
}

/**
 * A ROOM OF PHOTOGRAPHS (rings, pendants, bangles). Every piece in its own photograph, in an
 * even grid of cream-matted prints. Tap a print to look closer: The Viewing opens with all its
 * photographs, Buy on WhatsApp, and the way to the piece's page. The name beneath each print is
 * a plain link to that page.
 */
export function PhotoRoom({ pieces, label }: { pieces: PhotoPiece[]; label: string }) {
  const groups = useMemo(() => [...new Set(pieces.map((p) => p.group).filter(Boolean))] as string[], [pieces])
  const [group, setGroup] = useState<string | null>(null)
  const [open, setOpen] = useState<PhotoPiece | null>(null)
  const shown = group ? pieces.filter((p) => p.group === group) : pieces
  const view: ViewingPiece | null = open && { slug: open.slug, name: open.name, price: open.price, href: open.href, cutout: open.base, photos: open.photos, studio: open.studio, productId: open.productId, plain: true, start: 0 }
  return (
    <>
      <div className="room-bar">
        <p className="num room-count" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}
        </p>
        {groups.length > 1 && (
          <div className="room-chips" role="group" aria-label="Show">
            {[null, ...groups].map((g) => (
              <button key={g ?? 'all'} type="button" aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g ?? 'All'}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="room-grid" aria-label={label}>
        {shown.map((p, i) => (
          <li key={p.slug} className="room-tile" data-sold={p.sold}>
            <button type="button" className="room-print" onClick={() => setOpen(p)} aria-label={`Look closer at the ${p.name}`}>
              <picture>
                <source type="image/avif" srcSet={`${p.base}-480.avif 480w, ${p.base}-960.avif 960w`} sizes="(min-width: 1024px) 24vw, 48vw" />
                <img
                  src={`${p.base}-960.webp`}
                  srcSet={`${p.base}-480.webp 480w, ${p.base}-960.webp 960w`}
                  sizes="(min-width: 1024px) 24vw, 48vw"
                  alt={p.alt}
                  loading={i < 8 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
              </picture>
              {p.sold && <span className="room-sold">Sold</span>}
              <span className="room-look" aria-hidden>
                Look closer
              </span>
            </button>
            <Link href={p.href} className="room-name font-display">
              {p.name}
            </Link>
            <span className="room-meta">{p.sold ? 'Sold' : p.price}</span>
          </li>
        ))}
      </ul>
      <Viewing piece={view} onClose={() => setOpen(null)} />
    </>
  )
}
