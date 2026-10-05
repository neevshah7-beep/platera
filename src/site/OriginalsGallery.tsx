'use client'

import { useState } from 'react'
import { OriginalsViewer } from './OriginalsViewer'

/** A grid of the original store photographs; each opens the full-screen viewer at that photograph. */
export function OriginalsGallery({ name, photos }: { name: string; photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!photos.length) return null
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((p, k) => (
          <li key={p}>
            <button type="button" onClick={() => setOpen(k)} className="group block w-full overflow-hidden rounded-[3px] bg-espresso/5" aria-label={`Open original photograph ${k + 1}`}>
              <img src={`${p}-800.webp`} alt={`${name}, original photograph ${k + 1}`} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-entry)] group-hover:scale-[1.04]" />
            </button>
          </li>
        ))}
      </ul>
      <OriginalsViewer name={name} photos={photos} open={open !== null} start={open ?? 0} onClose={() => setOpen(null)} />
    </>
  )
}
