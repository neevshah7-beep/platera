'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'

/** The session's one Lenis instance: inertial scroll, so stopping decelerates rather than halts. */
export const scroller: { lenis: Lenis | null } = { lenis: null }

export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.3 })
    scroller.lenis = lenis
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      scroller.lenis = null
    }
  }, [])
  return null
}
