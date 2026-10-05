'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createCalendar, type CalendarApi, type CalendarDay } from './calendar'

/**
 * SCENE 6 · THE COUNTER (calendar.ts). Flip the Platera desk calendar to the day you'd
 * like to come in, choose the morning or evening sitting, and reserve. The store's facts
 * sit beneath, set like a card at the counter.
 */
export function VisitScene({
  days,
  address,
  hours,
  phone,
  whatsapp,
  maps,
}: {
  days: (CalendarDay & { long: string })[]
  address: string[]
  hours: string
  phone: string
  whatsapp: string
  maps: string
}) {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<CalendarApi | null>(null)
  const [index, setIndex] = useState(0)
  const [sitting, setSitting] = useState<'morning' | 'evening'>('evening')

  useEffect(() => {
    const c = canvas.current!
    let cal: CalendarApi | null = null
    const start = async () => {
      await document.fonts.ready // the pages are typeset in the house fonts
      if (!cal) cal = api.current = createCalendar(c, days, setIndex)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void start()
        else if (cal) {
          cal.dispose()
          cal = api.current = null
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(section.current!)
    const ro = new ResizeObserver(() => api.current?.resize())
    ro.observe(c)
    return () => {
      io.disconnect()
      ro.disconnect()
      cal?.dispose()
    }
  }, [days])

  const send = (e: React.PointerEvent, phase: 'down' | 'move' | 'up') => {
    const r = canvas.current!.getBoundingClientRect()
    api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, phase)
    if (phase === 'down') (e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const day = days[index]

  return (
    <section id="chapter-counter" ref={section} aria-labelledby="visit-title" className="relative flex flex-col overflow-hidden md:block md:h-[100svh] md:min-h-[680px]">
      <div className="visit-stage relative h-[64svh] md:absolute md:inset-0 md:h-auto">
      <canvas
        ref={canvas}
        aria-hidden
        className="absolute inset-0 h-full w-full cursor-grab touch-pan-x active:cursor-grabbing"
        onPointerDown={(e) => send(e, 'down')}
        onPointerMove={(e) => send(e, 'move')}
        onPointerUp={(e) => send(e, 'up')}
        onPointerCancel={(e) => send(e, 'up')}
      />
      </div>
      <div className="visit-copy pointer-events-none px-[var(--gutter)] pb-16 md:absolute md:pb-0">
        <p className="eyebrow">The counter</p>
        <h2 id="visit-title" className="visit-title">See it in your hand <em className="accent">before you decide.</em></h2>
        <p className="visit-choice" aria-live="polite">
          <span className="text-muted">Flip to your day:</span> <span className="font-display">{day?.long}</span>
        </p>
        <div className="pointer-events-auto mt-4 flex items-center gap-2">
          <button type="button" className="visit-arrow" aria-label="Previous day" onClick={() => api.current?.flip(-1)} disabled={index === 0}>
            ‹
          </button>
          <button type="button" className="visit-arrow" aria-label="Next day" onClick={() => api.current?.flip(1)} disabled={index >= days.length - 1}>
            ›
          </button>
          <div role="radiogroup" aria-label="Sitting" className="ml-3 flex gap-2">
            {(['morning', 'evening'] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={sitting === s} className="visit-sitting" onClick={() => setSitting(s)}>
                {s === 'morning' ? '10 am – 2 pm' : '4 – 9 pm'}
              </button>
            ))}
          </div>
        </div>
        <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
          <Link href={`/appointment?date=${day?.value}&sitting=${sitting}`} className="btn btn-primary">Reserve this visit</Link>
          <a href={whatsapp} className="btn btn-quiet">Ask on WhatsApp</a>
        </div>
        <address className="visit-card not-italic">
          {address.map((l) => (
            <span key={l} className="block">{l}</span>
          ))}
          <span className="num mt-2 block text-muted">{hours} · {phone}</span>
          <a href={maps} className="link pointer-events-auto mt-2 inline-block">Directions</a>
        </address>
      </div>
    </section>
  )
}
