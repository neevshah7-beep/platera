'use client'

import { useState } from 'react'
import { Viewing, type ViewingPiece } from '@/site/Viewing'

/**
 * THE PHOTOGRAPH (piece page, for pieces shown in their photographs: rings, pendants,
 * bangles). The main photograph large in a cream mat with a gold fillet, every photograph of
 * the piece as prints beneath it; any of them opens The Viewing at that photograph.
 */
export function PhotoStage({ piece, main, alt }: { piece: Omit<ViewingPiece, 'start'>; main: string; alt: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const prints = [...(piece.studio ?? []), ...piece.photos]
  return (
    <div className="stage">
      <button type="button" className="stage-main" onClick={() => setOpen(0)} aria-label={`Look closer at the ${piece.name}`}>
        <picture>
          <source type="image/avif" srcSet={`${main}-960.avif 960w, ${main}-1600.avif 1600w`} sizes="(min-width: 1024px) 50vw, 100vw" />
          <img src={`${main}-1600.webp`} srcSet={`${main}-960.webp 960w, ${main}-1600.webp 1600w`} sizes="(min-width: 1024px) 50vw, 100vw" alt={alt} fetchPriority="high" draggable={false} />
        </picture>
        <span className="stage-hint">Tap to look closer</span>
      </button>
      {prints.length > 1 && (
        <ul className="stage-prints" aria-label="All photographs">
          {prints.map((p, k) => (
            <li key={p}>
              <button type="button" onClick={() => setOpen(k + 1)} aria-label={`Photograph ${k + 1} of ${prints.length}`}>
                <img src={`${p}-800.webp`} alt="" loading="lazy" decoding="async" draggable={false} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Viewing piece={open === null ? null : { ...piece, plain: true, start: open }} onClose={() => setOpen(null)} />
    </div>
  )
}
