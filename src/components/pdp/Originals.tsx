'use client'

import { useEffect, useRef, useState } from 'react'
import { Viewing, type ViewingPiece } from '@/site/Viewing'

/**
 * THE ORIGINALS. The store photographs, unedited, shown large on an espresso wall: each in
 * a cream mat with a gold fillet, uncovered by a wipe of light as it comes into view, and
 * the piece on its own beside them. Any one opens The Viewing at that photograph.
 *
 * kind="studio" shows the piece's studio images instead, labelled as such (with the piece
 * on its own when there are no store photographs to carry it). The Viewing lists studio
 * images first, then store photographs, then the piece on its own.
 */
export function Originals({ piece, kind = 'store' }: { piece: Omit<ViewingPiece, 'start'>; kind?: 'store' | 'studio' }) {
  const [open, setOpen] = useState<number | null>(null)
  const list = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && ((e.target as HTMLElement).dataset.in = 'true')),
      { rootMargin: '0px 0px -12% 0px' },
    )
    list.current?.querySelectorAll('li').forEach((li) => io.observe(li))
    return () => io.disconnect()
  }, [])
  const studio = piece.studio ?? []
  const cutout = { src: `${piece.cutout}-1600.webp`, label: 'The piece, on its own', cutout: true, at: studio.length + piece.photos.length }
  const tiles =
    kind === 'studio'
      ? [...studio.map((p, k) => ({ src: `${p}-1600.webp`, label: 'Studio image', cutout: false, at: k })), ...(piece.photos.length ? [] : [cutout])]
      : [...piece.photos.map((p, k) => ({ src: `${p}-1600.webp`, label: 'As photographed at the counter', cutout: false, at: studio.length + k })), cutout]
  return (
    <>
      <ul ref={list} className="orig-grid" data-count={tiles.length}>
        {tiles.map((t, k) => (
          <li key={t.src} className="orig-tile" data-cutout={t.cutout} style={{ ['--d' as string]: `${(k % 3) * 120}ms` }}>
            <button type="button" onClick={() => setOpen(t.at)} aria-label={`Look closer: ${t.label.toLowerCase()}`}>
              <span className="orig-mat">
                <img src={t.src} alt={`${piece.name}: ${t.label.toLowerCase()}`} loading="lazy" decoding="async" draggable={false} />
                <span className="orig-wipe" aria-hidden />
              </span>
              <span className="orig-caption">
                <span>{t.label}</span>
                <span className="orig-look">Look closer <span aria-hidden>→</span></span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Viewing piece={open === null ? null : { ...piece, start: open }} onClose={() => setOpen(null)} />
    </>
  )
}
