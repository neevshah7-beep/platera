'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudVeil } from './CloudVeil'
import { scroller } from './SmoothScroll'
import { entry, useEntry } from './entry'

/**
 * THE ENTRY. A champagne veil with the wordmark. A gold hairline fills with the real load
 * progress of the first scene; when it is ready the invitation appears. Entering fills the
 * screen with sunlit cloud (CloudVeil); it parts, and the ring falls out of the sky. Scroll is held until
 * then, so nobody scrolls past a scene that hasn't arrived.
 */
export function EntryGate() {
  const progress = useEntry((s) => s.progress)
  const ready = useEntry((s) => s.ready)
  const entered = useEntry((s) => s.entered)
  const [gone, setGone] = useState(false)
  // Within a visit (a refresh, or coming back to the homepage) there is no veil; every new
  // visit, once the site has been closed, enters through the gate and the clouds again.
  const [returning, setReturning] = useState(false)
  useEffect(() => {
    // Set before first paint by the script in the root layout, so the veil never flashes.
    if (document.documentElement.dataset.returning === '1') {
      setReturning(true)
      entry.set({ entered: true, returning: true })
    }
  }, [])
  const [shown, setShown] = useState(0)

  // The number counts toward the real progress on an eased curve, never jumping.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setShown((v) => {
        const n = v + (progress * 100 - v) * 0.12
        return Math.abs(progress * 100 - n) < 0.2 ? progress * 100 : n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  useEffect(() => {
    if (entered) {
      document.documentElement.dataset.entered = '1'
      try {
        // Remembered for this visit only: a refresh walks straight in, a new visit enters again.
        sessionStorage.setItem('platera:entered', '1')
      } catch {}
      scroller.lenis?.start()
      return
    }
    // Scroll waits behind the veil until the visitor enters.
    scroller.lenis?.stop()
  }, [entered])

  const done = useCallback(() => setGone(true), [])
  if (gone || returning) return null
  return (
    <>
    {entered && <CloudVeil onDone={done} />}
    <div className="entry-gate" data-entered={entered} data-ready={ready} aria-hidden={entered}>
      <span className="entry-sheen" aria-hidden />
      <GoldDust />
      <div className="entry-inner">
        {/* The seal: a gold ring that draws itself as the house loads, the monogram within. */}
        <div className="entry-seal" aria-hidden>
          <svg viewBox="0 0 200 200" className="entry-ring">
            <defs>
              <linearGradient id="entry-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7a5418" />
                <stop offset="0.45" stopColor="#c99a3e" />
                <stop offset="0.55" stopColor="#f1d488" />
                <stop offset="1" stopColor="#8a5f1c" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="rgb(201 154 62 / 0.22)" strokeWidth="1" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="url(#entry-gold)" strokeWidth="1.6" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - shown} transform="rotate(-90 100 100)" />
            <circle cx="100" cy="100" r="84" fill="none" stroke="rgb(201 154 62 / 0.35)" strokeWidth="0.6" />
          </svg>
          <span className="entry-mono font-display">P</span>
        </div>
        <p className="entry-word font-display">PLATERA</p>
        <p className="entry-line">Hallmarked silver · Gorai 1, Borivali West</p>
        <p className="entry-status num" aria-live="polite">{ready ? 'The house is ready' : `${Math.round(shown)}%`}</p>
        <button type="button" className="entry-enter" data-ready={ready} disabled={!ready} onClick={(e) => {
            e.currentTarget.blur()
            entry.set({ entered: true })
          }}>
          <span>Enter the house</span>
        </button>
      </div>
    </div>
    </>
  )
}

/** Fine gold dust drifting up through the light: a few dozen motes, each twinkling. */
function GoldDust() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(devicePixelRatio, 2)
    const size = () => {
      c.width = innerWidth * dpr
      c.height = innerHeight * dpr
    }
    size()
    addEventListener('resize', size)
    // Fine motes, and a few of them glints: four-pointed stars of light, as on cut metal.
    const motes = Array.from({ length: 46 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.35 + Math.random() * 0.8, v: 0.006 + Math.random() * 0.016, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2, glint: i % 6 === 0 }))
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, c.width, c.height)
      for (const m of motes) {
        m.y -= m.v * dt
        m.x += Math.sin(now / 1000 * 0.4 + m.p) * 0.00012
        if (m.y < -0.02) {
          m.y = 1.02
          m.x = Math.random()
        }
        const tw = Math.pow(Math.max(0, Math.sin(now / 1000 * m.s + m.p)), 2)
        const x = m.x * c.width, y = m.y * c.height
        ctx.fillStyle = `rgba(184, 138, 52, ${0.55 * (0.3 + 0.7 * tw)})`
        ctx.beginPath()
        ctx.arc(x, y, m.r * dpr, 0, Math.PI * 2)
        ctx.fill()
        if (m.glint && tw > 0.05) {
          const L = (5 + 9 * tw) * dpr
          const g = ctx.createLinearGradient(x - L, y, x + L, y)
          g.addColorStop(0, 'rgba(201, 154, 62, 0)')
          g.addColorStop(0.5, `rgba(201, 154, 62, ${0.8 * tw})`)
          g.addColorStop(1, 'rgba(201, 154, 62, 0)')
          ctx.fillStyle = g
          ctx.fillRect(x - L, y - 0.5 * dpr, 2 * L, 1 * dpr)
          const v = ctx.createLinearGradient(x, y - L, x, y + L)
          v.addColorStop(0, 'rgba(201, 154, 62, 0)')
          v.addColorStop(0.5, `rgba(201, 154, 62, ${0.8 * tw})`)
          v.addColorStop(1, 'rgba(201, 154, 62, 0)')
          ctx.fillStyle = v
          ctx.fillRect(x - 0.5 * dpr, y - L, 1 * dpr, 2 * L)
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', size)
    }
  }, [])
  return <canvas ref={canvas} className="entry-dust" aria-hidden />
}
