'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useManagedScene } from '../useManagedScene'
import { createThread, DRAWINGS } from './thread'

/**
 * SCENE · THE HOUSE (about Platera), drawn in one line of silver (thread.ts). The section
 * is pinned for six screens; each chapter of the story is a drawing the line becomes, and
 * the words for it rise beside it as it settles.
 */
const CHAPTERS = [
  { eyebrow: 'The house', title: <>Platera, <em className="accent">in one line.</em></>, body: 'A small house with one idea: choose fewer pieces, choose them properly, and show you everything.' },
  { eyebrow: 'The eye', title: <>We choose; <em className="accent">we don’t make.</em></>, body: 'Every piece is turned over and chosen for its metal, its making and its design. The back of a piece tells you more than the front.' },
  { eyebrow: 'The mark', title: <>925, <em className="accent">and proven.</em></>, body: 'Everything in the house is sterling silver, BIS hallmarked with its own HUID. You never have to take our word for it.' },
  { eyebrow: 'The balance', title: <>Every rupee, <em className="accent">shown.</em></>, body: 'Weight × today’s rate, the making charge and the GST, each on its own line. A breakdown earns trust; a single number only asks for it.' },
  { eyebrow: 'The door', title: <>It ends <em className="accent">with a person.</em></>, body: 'Presented with Bhairav Jewellers at Gorai 1, Borivali West. Come in and hold it, or message us; someone will answer.' },
]

export function HouseScene({ id = 'chapter-house' }: { id?: string }) {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const api = useManagedScene(section, host, (c) => createThread(c), [])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))) * DRAWINGS
      api.current?.setProgress(p)
      // Each chapter's words arrive once its drawing has settled.
      const seg = Math.min(DRAWINGS - 1, Math.floor(p))
      const k = p - seg < 0.45 && seg > 0 ? -1 : seg
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
    <section id={id} ref={section} aria-label="About Platera" className="house relative" style={{ height: `${(DRAWINGS + 1) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="house-wall" aria-hidden />
        <div ref={host} className="absolute inset-0" />
        <ol className="house-index" aria-hidden>
          {CHAPTERS.map((c, i) => (
            <li key={c.eyebrow} data-on={i === active}>{c.eyebrow}</li>
          ))}
        </ol>
        {CHAPTERS.map((c, i) => (
          <div key={c.eyebrow} className="house-copy px-[var(--gutter)]" data-on={i === active} aria-hidden={i !== active}>
            <p className="eyebrow">{c.eyebrow}</p>
            <h2 className="house-title">{c.title}</h2>
            <p className="house-body">{c.body}</p>
            {i === CHAPTERS.length - 1 && (
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/appointment" className="btn btn-primary" tabIndex={i === active ? 0 : -1}>Book a visit</Link>
                <Link href="/about" className="btn btn-quiet" tabIndex={i === active ? 0 : -1}>How Platera works</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
