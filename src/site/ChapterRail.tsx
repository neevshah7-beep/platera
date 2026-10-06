'use client'

import { useEffect, useRef, useState } from 'react'
import { scroller } from './SmoothScroll'

export type Chapter = { id: string; label: string }

/**
 * The chapters of the homepage, always in view beneath the header: a quiet index with a
 * gold hairline that fills as you travel through the house. The current chapter is lit;
 * any chapter is one click away (the scroll glides there, it never jumps).
 */
export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0)
  const line = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    // Where each chapter starts is measured once (and again on resize), not every frame: the
    // per-frame work is then a comparison against scrollY, with no layout reads.
    let tops: number[] = []
    let max = 1
    const measure = () => {
      tops = chapters.map((c) => {
        const el = document.getElementById(c.id)
        return el ? el.getBoundingClientRect().top + scrollY : Infinity
      })
      max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    let raf = 0
    let lastY = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      setShown(document.documentElement.dataset.entered === '1')
      if (scrollY === lastY) return
      lastY = scrollY
      const mid = scrollY + innerHeight * 0.5
      let a = 0
      tops.forEach((t, i) => t <= mid && (a = i))
      setActive((v) => (v === a ? v : a))
      if (line.current) line.current.style.transform = `scaleX(${scrollY / max})`
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [chapters])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (scroller.lenis) scroller.lenis.scrollTo(el, { duration: 2.2 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav aria-label="Chapters" className="chapter-rail" data-shown={shown}>
      <ol>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <button type="button" data-on={i === active} data-past={i < active} onClick={() => go(c.id)}>
              <span className="num chapter-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="chapter-label">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <span ref={line} className="chapter-line" aria-hidden />
    </nav>
  )
}
