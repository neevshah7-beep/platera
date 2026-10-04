'use client'

import { useState } from 'react'
import { STORE } from '@/lib/store'

/**
 * The map loads only when asked for. A Google Maps iframe costs more than the rest of
 * the page combined, and most visitors need the address, not the tiles.
 */
export function MapEmbed() {
  const [show, setShow] = useState(false)
  const q = encodeURIComponent(`${STORE.address.line1}, ${STORE.address.line2}, ${STORE.address.city} ${STORE.address.postalCode}`)
  return (
    <div className="mt-6">
      {show ? (
        <iframe
          title="Map showing the store in Gorai 1, Borivali West"
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          className="aspect-[4/3] w-full border-0 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-quiet" onClick={() => setShow(true)}>Show the map</button>
          <a className="btn btn-quiet" href={STORE.mapsUrl} target="_blank" rel="noopener">Directions in Google Maps</a>
        </div>
      )}
    </div>
  )
}
