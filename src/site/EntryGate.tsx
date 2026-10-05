'use client'

import { useCallback, useEffect, useState } from 'react'
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
  // Visitors who have entered before (this session or an earlier one) walk straight in:
  // no veil on a refresh or a return visit.
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
        localStorage.setItem('platera:entered', '1')
      } catch {}
      scroller.lenis?.start()
    }
    scroller.lenis?.stop()
  }, [entered])

  const done = useCallback(() => setGone(true), [])
  if (gone || returning) return null
  return (
    <>
    {entered && <CloudVeil onDone={done} />}
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
    </>
  )
}
