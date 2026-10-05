'use client'

import { prewarm } from '../prewarm'
import { useEffect, useRef, useState } from 'react'
import { createStrand, PROMISES, type StrandApi } from './strand'

export type StrandPromise = { mark: string; title: string; body: string }

/**
 * SCENE 2 · THE STRAND (strand.ts). The section is pinned for six screens; scroll moves
 * the camera along the necklace and brings each promise bead forward in turn. Each
 * promise's words are tied to its bead by a gold thread that draws across, and then the
 * words unveil along it, left to right.
 */
export function StrandScene({ promises }: { promises: StrandPromise[] }) {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<StrandApi | null>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const c = canvas.current!
    let strand: StrandApi | null = null
    // Build the scene only when it is about to be seen; tear it down when far away.
    const job = prewarm(() => {
      if (!strand) strand = api.current = createStrand(c)
    })
    const io = new IntersectionObserver(([e]) => e.isIntersecting && job.now(), { rootMargin: '80% 0px' })
    io.observe(section.current!)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const s = section.current!
      const r = s.getBoundingClientRect()
      const total = r.height - innerHeight
      const p = Math.min(1, Math.max(0, -r.top / total)) * PROMISES
      api.current?.setProgress(p)
      const k = p > 0.15 && p < PROMISES - 0.05 ? Math.min(PROMISES - 1, Math.floor(p)) : -1
      setActive((a) => (a === k ? a : k))
    }
    raf = requestAnimationFrame(tick)

    const move = (e: PointerEvent, down: boolean | null) => {
      const r = c.getBoundingClientRect()
      if (e.clientY < r.top || e.clientY > r.bottom) return
      api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, down)
    }
    const onMove = (e: PointerEvent) => move(e, null)
    const onDown = (e: PointerEvent) => move(e, true)
    const onUp = (e: PointerEvent) => move(e, false)
    addEventListener('pointermove', onMove, { passive: true })
    c.addEventListener('pointerdown', onDown)
    addEventListener('pointerup', onUp, { passive: true })
    const ro = new ResizeObserver(() => api.current?.resize())
    ro.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      job.cancel()
      ro.disconnect()
      removeEventListener('pointermove', onMove)
      c.removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
      strand?.dispose()
    }
  }, [])

  return (
    <section id="chapter-promises" ref={section} aria-labelledby="strand-title" className="strand relative" style={{ height: `${(PROMISES + 1) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full touch-pan-y" />
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
