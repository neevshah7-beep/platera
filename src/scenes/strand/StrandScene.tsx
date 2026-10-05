'use client'

import { useManagedScene } from '../useManagedScene'
import { useEffect, useRef, useState } from 'react'
import { createStrand, PROMISES } from './strand'

export type StrandPromise = { mark: string; title: string; body: string }

/**
 * SCENE 2 · THE STRAND (strand.ts). The section is pinned for six screens; scroll moves
 * the camera along the necklace and brings each promise bead forward in turn. Each
 * promise's words are tied to its bead by a gold thread that draws across, and then the
 * words unveil along it, left to right.
 */
export function StrandScene({ promises }: { promises: StrandPromise[] }) {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const api = useManagedScene(section, host, (c) => createStrand(c), [])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))) * PROMISES
      api.current?.setProgress(p)
      const k = p > 0.15 && p < PROMISES - 0.05 ? Math.min(PROMISES - 1, Math.floor(p)) : -1
      setActive((v) => (v === k ? v : k))
    }
    raf = requestAnimationFrame(tick)
    const at = (e: PointerEvent) => {
      const r = host.current!.getBoundingClientRect()
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const
    }
    const onMove = (e: PointerEvent) => {
      const r = host.current!.getBoundingClientRect()
      if (e.clientY < r.top || e.clientY > r.bottom) return
      api.current?.pointer(...at(e), null)
    }
    const onDown = (e: PointerEvent) => api.current?.pointer(...at(e), true)
    const onUp = (e: PointerEvent) => api.current?.pointer(...at(e), false)
    const h = host.current!
    addEventListener('pointermove', onMove, { passive: true })
    h.addEventListener('pointerdown', onDown)
    addEventListener('pointerup', onUp, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      h.removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
    }
  }, [api])

  return (
    <section id="chapter-promises" ref={section} aria-labelledby="strand-title" className="strand relative" style={{ height: `${(PROMISES + 1) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={host} className="absolute inset-0 touch-pan-y" />
        <div className="strand-eyebrow pointer-events-none absolute px-[var(--gutter)]">
          <h2 id="strand-title" className="eyebrow">Six promises, strung together</h2>
        </div>
        <ol className="pointer-events-none absolute inset-0">
          {promises.map((p, i) => (
            <li key={p.title} data-on={active === i} className="strand-promise">
              <span className="strand-thread" aria-hidden />
              <div className="strand-words">
                <p className="num strand-index">{String(i + 1).padStart(2, '0')} / {String(promises.length).padStart(2, '0')}</p>
                <h3 className="strand-title">{p.title}</h3>
                <p className="strand-body measure">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="strand-hint eyebrow" aria-hidden>Hold a bead and pull</p>
      </div>
    </section>
  )
}
