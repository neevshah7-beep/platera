'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics/client'
import { createLamp, MOODS, type LampApi, type Mood } from './lamp'

/**
 * The piece under the lamp (lamp.ts). The photograph is the poster, shown until the lit
 * scene has drawn; it stays as the image search engines and screen readers get.
 */
export function PieceLamp({ slug, base, width, height, maps, poster }: { slug: string; base: string; width: number; height: number; maps: boolean; poster: React.ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<LampApi | null>(null)
  const [ready, setReady] = useState(false)
  const [mood, setMood] = useState<Mood>('lamp')

  useEffect(() => {
    const c = canvas.current!
    let a: LampApi | null = null
    try {
      a = api.current = createLamp(c, { base, width, height, maps })
    } catch {
      return
    }
    const t = setTimeout(() => setReady(true), 700)
    const ro = new ResizeObserver(() => a?.resize())
    ro.observe(c)
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      if (e.clientY < r.top - 80 || e.clientY > r.bottom + 80) return
      a?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    }
    addEventListener('pointermove', move, { passive: true })
    return () => {
      clearTimeout(t)
      ro.disconnect()
      removeEventListener('pointermove', move)
      a?.dispose()
    }
  }, [base, width, height, maps])

  return (
    <div>
      <div className="lamp-stage relative">
        <div className={`absolute inset-0 transition-opacity duration-[1100ms] ${ready ? 'opacity-0' : 'opacity-100'}`}>{poster}</div>
        <canvas ref={canvas} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-[1100ms] ${ready ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      <p className="mt-3 text-step--1 text-muted">
        <span className="hidden sm:inline">Carry the lamp across the piece with your pointer.</span>
        <span className="sm:hidden">Touch and drag to move the lamp.</span>
      </p>
      <div role="radiogroup" aria-label="Light the piece by" className="mt-4 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mood === m.id}
            className="visit-sitting"
            onClick={() => {
              setMood(m.id)
              api.current?.setMood(m.id)
              track('light_mood_changed', { mood: m.id, piece: slug })
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
