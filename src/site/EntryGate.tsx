'use client'

import { useEffect, useState } from 'react'
import { scroller } from './SmoothScroll'
import { entry, useEntry } from './entry'

/**
 * THE ENTRY. A champagne veil with the wordmark. A gold hairline fills with the real load
 * progress of the first scene; when it is ready the invitation appears. Entering lifts the
 * veil away upward with a bright edge of light, and the fall begins. Scroll is held until
 * then, so nobody scrolls past a scene that hasn't arrived.
 */
export function EntryGate() {
  const progress = useEntry((s) => s.progress)
  const ready = useEntry((s) => s.ready)
  const entered = useEntry((s) => s.entered)
  const [gone, setGone] = useState(false)
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
      scroller.lenis?.start()
      const t = setTimeout(() => setGone(true), 1600)
      return () => clearTimeout(t)
    }
    scroller.lenis?.stop()
  }, [entered])

  if (gone) return null
  return (
    <div className="entry-gate" data-entered={entered} aria-hidden={entered}>
      <div className="entry-inner">
        <p className="eyebrow">Hallmarked 925 · Gorai 1</p>
        <p className="entry-word metal-text-deep font-display">PLATERA</p>
        <div className="entry-bar" aria-hidden>
          <span style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <p className="num text-step--1 text-muted" aria-live="polite">
          {ready ? 'The house is ready' : `${Math.round(shown)}%`}
        </p>
        <button type="button" className="entry-enter" data-ready={ready} disabled={!ready} onClick={(e) => {
            e.currentTarget.blur()
            entry.set({ entered: true })
          }}>
          Enter Platera
        </button>
      </div>
    </div>
  )
}
