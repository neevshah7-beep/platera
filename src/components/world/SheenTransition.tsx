'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Page transition: a single sheen of light passes across the screen, the way light
 * runs along a polished edge when a piece is tilted. Never a crossfade, never a flash.
 * It covers the moment the 3D world swaps rooms.
 */
export function SheenTransition() {
  const pathname = usePathname()
  const first = useRef(true)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setRun((n) => n + 1)
  }, [pathname])

  if (!run) return null
  return <div key={run} aria-hidden className="sheen-wipe pointer-events-none fixed inset-0 z-[60]" />
}
