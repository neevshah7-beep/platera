'use client'

import { useEffect, useRef, useState } from 'react'
import { useManagedScene } from '../useManagedScene'
import { createJourney } from './journey'

/**
 * SCENE · THE JOURNEY (journey.ts). Pinned for several screens: the ring floats, the camera
 * dives inside it, and the house's story comes round engraved in the gold, one chapter at a
 * time, its words set clear beside it.
 */
const CHAPTERS = [
  { mark: 'GORAI · I', sub: 'Where it began', title: <>Where it <em className="accent">began.</em></>, body: 'A counter in Gorai 1, Borivali West: Bhairav Jewellers, where every piece is weighed, tested and set aside by hand.' },
  { mark: 'MMXXVI', sub: 'Platera · 2026', title: <>Platera, <em className="accent">2026.</em></>, body: 'A house with one idea: choose fewer pieces, choose them properly, and show you everything.' },
  { mark: '925', sub: 'The first collection', title: <>The first <em className="accent">collection.</em></>, body: 'Hallmarked sterling silver, priced by weight at the day’s rate, with every line of the price sent to you.' },
  { mark: 'THE SITTING', sub: 'Autumn 2026', title: <>The first <em className="accent">sitting.</em></>, body: 'Merreeda and Aarya wear the collection for our first campaign: three looks, Rouge, Saffron and Noir.' },
  { mark: 'AU · NEXT', sub: 'Gold, next', title: <>Gold, <em className="accent">next.</em></>, body: 'The same promise, in gold: weighed, hallmarked and priced in the open. The next line in the ring is yours.' },
]
const MARKS = CHAPTERS.map((c) => ({ line: c.mark, sub: c.sub }))
const IN1 = 0.2

export function JourneyScene() {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const api = useManagedScene(section, host, (c) => createJourney(c, MARKS), [])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      api.current?.setProgress(p)
      // Before the dive, the opening words; inside, the chapter whose mark faces you.
      const inside = Math.max(0, (p - IN1) / (1 - IN1)) * (CHAPTERS.length - 1)
      const k = p < IN1 - 0.04 ? -1 : Math.min(CHAPTERS.length - 1, Math.round(inside))
      setActive((v) => (v === k ? v : k))
    }
    raf = requestAnimationFrame(tick)
    const onMove = (e: PointerEvent) => api.current?.pointer(e.clientX / innerWidth, e.clientY / innerHeight)
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
    }
  }, [api])

  return (
    <section id="chapter-journey" ref={section} aria-labelledby="journey-title" className="journey-sec relative" style={{ height: `${CHAPTERS.length * 70 + 120}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="journey-light" aria-hidden />
        <div ref={host} className="absolute inset-0" />
        <div className="journey-scrim" aria-hidden style={{ ['--scrim' as string]: 1 }} />
        <div className="journey-open px-[var(--gutter)]" data-on={active === -1}>
          <p className="eyebrow">The journey</p>
          <h2 id="journey-title" className="journey-title">Engraved, <em className="accent">inside the ring.</em></h2>
          <p className="journey-body">Inside a ring is where a jeweller engraves what matters. Ours carries the story of the house. Scroll, and step inside.</p>
        </div>
        {CHAPTERS.map((c, i) => (
          <div key={c.mark} className="journey-copy px-[var(--gutter)]" data-on={i === active} aria-hidden={i !== active}>
            <p className="journey-n num">{String(i + 1).padStart(2, '0')} <span>/ {String(CHAPTERS.length).padStart(2, '0')}</span></p>
            <h3 className="journey-title">{c.title}</h3>
            <p className="journey-body">{c.body}</p>
          </div>
        ))}
        <ol className="journey-track" aria-hidden>
          {CHAPTERS.map((c, i) => (
            <li key={c.mark} data-on={i === active} data-past={i < active}>
              <span className="journey-dot" />
              <span className="journey-sub">{c.sub}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
