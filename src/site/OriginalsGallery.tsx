'use client'

import { useState } from 'react'
import { Viewing, type ViewingPiece } from './Viewing'

/** The original store photographs as mounted prints; each opens The Viewing at that photograph. */
export function OriginalsGallery({ piece }: { piece: Omit<ViewingPiece, 'start'> }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!piece.photos.length) return null
  return (
    <>
      <ul className="originals-grid">
        {piece.photos.map((p, k) => (
          <li key={p} style={{ ['--tilt' as string]: `${(k % 2 ? 1 : -1) * (0.6 + (k % 3) * 0.5)}deg` }}>
            <button type="button" onClick={() => setOpen(k)} aria-label={`Look closer at photograph ${k + 1}`}>
              <img src={`${p}-800.webp`} alt={`${piece.name}, as photographed at the store`} loading="lazy" />
              <span className="originals-grid-cta">Look closer</span>
            </button>
          </li>
        ))}
      </ul>
      <Viewing piece={open === null ? null : { ...piece, start: open }} onClose={() => setOpen(null)} />
    </>
  )
}
