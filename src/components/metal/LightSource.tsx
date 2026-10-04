'use client'

import { useEffect } from 'react'

/**
 * One light for the whole page. Its horizontal position (--sheen-x on <html>)
 * follows the pointer with a slow damping, and every .metal-rule reads it, so all
 * polished edges catch the same light at the same time, as they would in a room.
 * One listener, one rAF loop that stops once the light settles, no React re-renders.
 */
export function LightSource() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    let target = 50
    let current = 50
    let frame = 0

    const tick = () => {
      current += (target - current) * 0.06
      root.style.setProperty('--sheen-x', `${current.toFixed(2)}%`)
      frame = Math.abs(target - current) > 0.05 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e: PointerEvent) => {
      target = (e.clientX / window.innerWidth) * 100
      if (!frame) frame = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])
  return null
}

export function MetalRule({ metal = 'argent', className = '' }: { metal?: 'argent' | 'champagne'; className?: string }) {
  return <div role="presentation" className={`metal-rule ${className}`} data-metal={metal} />
}
