'use client'

import { useEffect } from 'react'
import { world, type Station } from './store'

/**
 * A page tells the 3D world which station it is. Sections of the page marked with
 * data-world-section="N" drive the camera: scrolling through section N moves the
 * scroll value from N to N+1.
 */
export function WorldStation({ station }: { station: Station }) {
  const key = JSON.stringify(station)
  useEffect(() => {
    // ready goes back to false until this station's scene (and its textures) has drawn.
    world.set({ station, scroll: 0, hovered: null, ready: false, mood: 'studio' })
    let frame = 0
    const measure = () => {
      frame = 0
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-world-section]'))
      if (!sections.length) return world.mutate({ scroll: 0 })
      const mid = window.innerHeight * 0.5
      let value = 0
      for (const el of sections) {
        const r = el.getBoundingClientRect()
        const i = Number(el.dataset.worldSection)
        if (r.top <= mid) value = i + Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)))
      }
      world.mutate({ scroll: value })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      // Leaving a 3D page: fall back to the quiet room until the next page declares itself.
      world.set({ station: { kind: 'quiet' }, scroll: 0, hovered: null })
      document.body.style.cursor = ''
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}
