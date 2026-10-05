'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'

/** The session's one Lenis instance: inertial scroll, so stopping decelerates rather than halts. */
export const scroller: { lenis: Lenis | null } = { lenis: null }

export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Brisk: each flick travels far and settles quickly, still with a smooth glide.
    const lenis = new Lenis({ lerp: 0.18, wheelMultiplier: 1.9, touchMultiplier: 2 })
    scroller.lenis = lenis
    // On the homepage, before the visitor has entered, scroll waits behind the gate.
    const d = document.documentElement.dataset
    if (location.pathname === '/' && d.returning !== '1' && d.entered !== '1') lenis.stop()
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
