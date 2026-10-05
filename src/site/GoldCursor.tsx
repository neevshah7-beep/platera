'use client'

import { useEffect, useRef } from 'react'

/**
 * A fine gold ring that follows the pointer a breath behind it and opens out over anything
 * that can be pressed. The system pointer stays; this only accompanies it. Desktop pointers
 * only, and never for visitors who prefer reduced motion.
 */
export function GoldCursor() {
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ring.current!
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        rx = x
        ry = y
        shown = true
        el.dataset.on = 'true'
      }
      const t = e.target as Element | null
      el.dataset.hot = String(Boolean(t?.closest('a, button, [role="radio"], input, select, textarea, label')))
    }
    const leave = () => {
      shown = false
      el.dataset.on = 'false'
    }
    const down = () => (el.dataset.down = 'true')
    const up = () => (el.dataset.down = 'false')
    const loop = () => {
      raf = requestAnimationFrame(loop)
      rx += (x - rx) * 0.22
      ry += (y - ry) * 0.22
      el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
    }
    raf = requestAnimationFrame(loop)
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    addEventListener('pointerdown', down, { passive: true })
    addEventListener('pointerup', up, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
    }
  }, [])
  return <div ref={ring} className="gold-cursor" aria-hidden data-on="false" />
}
