'use client'

import { useEffect } from 'react'

/**
 * Marks the page with the way it is being scrolled (html[data-scroll="down" | "up"]) and
 * whether it has left the very top, so the header's secondary row can tuck away while
 * reading and return the moment the visitor scrolls back.
 */
export function ScrollDirection() {
  useEffect(() => {
    const d = document.documentElement.dataset
    let last = scrollY
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = scrollY
        // Written only when the value changes (each write restyles the page).
        if (Math.abs(y - last) > 4) {
          const v = y > last && y > 120 ? 'down' : 'up'
          if (d.scroll !== v) d.scroll = v
        }
        const sc = y > 24 ? '1' : '0'
        if (d.scrolled !== sc) d.scrolled = sc
        last = y
      })
    }
    on()
    addEventListener('scroll', on, { passive: true })
    return () => {
      removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
