'use client'

import Lenis from 'lenis'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { track } from '@/lib/analytics/client'
import type { ExperienceData } from './Experience'
import { STATIONS } from './layout'
import { useXp, xp, type Mood } from './state'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2'))
  } catch {
    return false
  }
}

/**
 * Turns the page's scroll into the walk through the hall. Every section has an anchor
 * ([data-anchor]); progress is exactly i when anchor i is centred in the viewport, and
 * interpolates linearly between anchors. Lenis smooths the wheel so the walk glides.
 */
function useScrollWalk(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    let anchors: number[] = []
    const measure = () => {
      anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor]')).map((el) => {
        const r = el.getBoundingClientRect()
        return r.top + window.scrollY + r.height / 2
      })
    }
    const update = () => {
      const y = window.scrollY + window.innerHeight / 2
      let p = 0
      if (anchors.length > 1) {
        if (y <= anchors[0]) p = 0
        else if (y >= anchors[anchors.length - 1]) p = anchors.length - 1
        else {
          const i = anchors.findIndex((a, k) => y >= a && y < anchors[k + 1])
          p = i + (y - anchors[i]) / (anchors[i + 1] - anchors[i])
        }
      }
      xp.mutate({ progress: Math.min(p, STATIONS.length - 1) })
    }
    let raf = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      update()
      raf = requestAnimationFrame(loop)
    }
    measure()
    raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    const onMove = (e: PointerEvent) => xp.mutate({ pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) } })
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      xp.mutate({ pointer: { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (45 - e.beta) / 30)) } })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      lenis?.destroy()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onTilt)
      xp.set({ ready: false, progress: 0 })
    }
  }, [enabled])
}

/**
 * The homepage's 3D hall, fixed behind the page. Until the hall has drawn, the Blender
 * poster stands in (it is also the LCP image, and what a phone without WebGL2 keeps).
 */
export function HomeExperience({ data, poster }: { data: ExperienceData; poster: React.ReactNode }) {
  const [on, setOn] = useState(false)
  const ready = useXp((s) => s.ready)
  useEffect(() => {
    if (webglAvailable()) setOn(true)
  }, [])
  useScrollWalk(on)
  useEffect(() => {
    document.documentElement.dataset.experience = on ? 'on' : 'off'
    return () => {
      delete document.documentElement.dataset.experience
    }
  }, [on])

  return (
    <>
      {on && <Experience data={data} />}
      <div
        aria-hidden={ready}
        className={`pointer-events-none fixed inset-0 z-0 bg-ground transition-opacity duration-[1200ms] ease-[var(--ease-settle)] ${ready ? 'opacity-0' : 'opacity-100'}`}
      >
        {poster}
      </div>
    </>
  )
}

const MOODS: { id: Mood; label: string }[] = [
  { id: 'studio', label: 'The lamp' },
  { id: 'daylight', label: 'Daylight' },
  { id: 'diya', label: 'Diya' },
  { id: 'evening', label: 'Evening' },
  { id: 'mandap', label: 'Mandap' },
]

/** Light Moods: relight the whole hall for an occasion. */
export function MoodSwitch({ className = '' }: { className?: string }) {
  const mood = useXp((s) => s.mood)
  const ready = useXp((s) => s.ready)
  if (!ready) return null
  return (
    <div role="radiogroup" aria-label="Light the hall by" className={`flex flex-wrap gap-2 ${className}`}>
      {MOODS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mood === m.id}
          onClick={() => {
            xp.set({ mood: m.id })
            track('light_mood_changed', { mood: m.id, piece: 'home' })
          }}
          className={`min-h-10 rounded-full border px-4 text-step--1 backdrop-blur-md transition-colors duration-[var(--dur-calm)] ${
            mood === m.id ? 'border-ink bg-ink text-ground' : 'border-rule-light bg-ground/70 text-ink hover:border-ink'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
