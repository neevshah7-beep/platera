'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWorld } from './store'

const World = dynamic(() => import('./World'), { ssr: false })

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Loads the 3D house after the page is interactive. The HTML page is complete on its
 * own (and is what Google, screen readers and phones without WebGL get); the world is
 * painted behind it once it's ready, so it never delays the first paint.
 */
export function WorldMount() {
  const [on, setOn] = useState(false)
  // The homepage has its own walk-through hall (src/experience); this world serves the other pages.
  const home = usePathname() === '/'
  useEffect(() => {
    if (!webglAvailable()) return
    const start = () => setOn(true)
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (idle) idle(start, { timeout: 1200 })
    else setTimeout(start, 300)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.world = on ? 'on' : 'off'
  }, [on])
  return on && !home ? <World /> : null
}

/**
 * A window onto the 3D world inside a page. Until the world has drawn, it shows the
 * poster (a real <img>, which is also the page's LCP element); then the poster fades
 * and the transparent window reveals the lit 3D piece behind the page.
 */
export function WorldWindow({ poster, className = '' }: { poster: React.ReactNode; className?: string }) {
  const ready = useWorld((s) => s.ready)
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-settle)] ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>{poster}</div>
    </div>
  )
}
