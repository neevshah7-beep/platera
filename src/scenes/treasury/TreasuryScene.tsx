'use client'

import { useEffect, useRef } from 'react'
import { createTreasury, type TreasuryApi } from './treasury'

/**
 * SCENE · THE TREASURY (treasury.ts). Pinned while the coin, the stone and the bar arrive.
 * The pointer is a lamp: carry it over the diamond to see it fire. Flick the coin to spin it.
 */
export function TreasuryScene({ rates }: { rates: { label: string; value: string }[] }) {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<TreasuryApi | null>(null)

  useEffect(() => {
    const c = canvas.current!
    let s: TreasuryApi | null = null
    const io = new IntersectionObserver(
      async ([e]) => {
        if (e.isIntersecting && !s) {
          await document.fonts.ready
          if (!s) s = api.current = createTreasury(c)
        } else if (!e.isIntersecting && s) {
          s.dispose()
          s = api.current = null
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(section.current!)
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      api.current?.setProgress(Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))))
    }
    raf = requestAnimationFrame(tick)
    const ro = new ResizeObserver(() => api.current?.resize())
    ro.observe(c)
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 'move')
    }
    addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      removeEventListener('pointermove', move)
      s?.dispose()
    }
  }, [])

  const send = (e: React.PointerEvent, phase: 'down' | 'up') => {
    const r = canvas.current!.getBoundingClientRect()
    api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, phase)
  }

  return (
    <section id="chapter-treasury" ref={section} aria-labelledby="treasury-title" className="relative h-[260svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full touch-pan-y" onPointerDown={(e) => send(e, 'down')} onPointerUp={(e) => send(e, 'up')} />
        <div className="treasury-copy pointer-events-none absolute px-[var(--gutter)]">
          <p className="eyebrow">The treasury</p>
          <h2 id="treasury-title" className="treasury-title">Pure metal, <em className="accent">priced in the open.</em></h2>
          <dl className="treasury-rates">
            {rates.map((r) => (
              <div key={r.label}>
                <dt className="eyebrow">{r.label}</dt>
                <dd className="num font-display">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="treasury-hint eyebrow" aria-hidden>Carry the light over the stone · flick the coin</p>
      </div>
    </section>
  )
}
