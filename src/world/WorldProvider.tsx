'use client'

import Lenis from 'lenis'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { roomPath } from './route'
import { xp } from './state'

const WorldCanvas = dynamic(() => import('./WorldCanvas'), { ssr: false })

function webgl2(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
}

/** Shared with the scroll-physics layer (T16): the one Lenis instance of the session. */
export const scroller: { lenis: Lenis | null } = { lenis: null }

/**
 * Measures the page's anchors. Progress is exactly i when anchor i is centred in the
 * viewport and interpolates linearly between anchors. Pages without anchors fall back to
 * [data-world-section] blocks (progress i → i + 1 across section i).
 */
function makeMeasure() {
  let anchors: number[] = []
  let sections: { top: number; height: number; i: number }[] = []
  return {
    measure() {
      anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor]')).map((el) => {
        const r = el.getBoundingClientRect()
        return r.top + window.scrollY + r.height / 2
      })
      sections = Array.from(document.querySelectorAll<HTMLElement>('[data-world-section]')).map((el) => {
        const r = el.getBoundingClientRect()
        return { top: r.top + window.scrollY, height: r.height, i: Number(el.dataset.worldSection) }
      })
    },
    progress(): number {
      const mid = window.scrollY + window.innerHeight / 2
      if (anchors.length > 1) {
        if (mid <= anchors[0]) return 0
        if (mid >= anchors[anchors.length - 1]) return anchors.length - 1
        const i = anchors.findIndex((a, k) => mid >= a && mid < anchors[k + 1])
        return i + (mid - anchors[i]) / (anchors[i + 1] - anchors[i])
      }
      let v = 0
      for (const s of sections) if (mid >= s.top) v = s.i + Math.min(1, (mid - s.top) / Math.max(1, s.height))
      return v
    },
  }
}

/**
 * THE WORLD PROVIDER. Mounted once in the shop layout, so it survives every client-side
 * navigation: the canvas, the renderer and the scene live for the whole session. Pages
 * declare their room with <Room>; this provider turns scroll and pointer into the world's
 * inputs and falls back to the quiet room for pages that declare none.
 */
export function WorldProvider() {
  const [on, setOn] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Verification handle (development only): client-side navigation for the T-scripts.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as { __world?: Record<string, unknown> }
    w.__world = { ...(w.__world ?? {}), navigate: (href: string) => router.push(href) }
  }, [router])

  // The canvas mounts after first paint (the H1 stays the LCP element).
  useEffect(() => {
    if (!webgl2()) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    xp.set({ reduced })
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (idle) idle(() => setOn(true), { timeout: 900 })
    else setTimeout(() => setOn(true), 200)
  }, [])

  // Pages that don't declare a room stand in the quiet room. Effects run child-first, so a
  // page's <Room> has already claimed this pathname when it has one.
  useEffect(() => {
    if (roomPath.current !== pathname) xp.set({ room: { key: 'quiet' }, progress: 0 })
  }, [pathname])

  // Scroll → progress and velocity; pointer and tilt → pointer.
  useEffect(() => {
    if (!on) return
    const reduced = xp.get().reduced
    const lenis = reduced ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, touchMultiplier: 1.4 })
    scroller.lenis = lenis
    const m = makeMeasure()
    let raf = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    let vel = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      const dt = Math.max(1, t - lastT) / 1000
      const y = window.scrollY
      const instant = (y - lastY) / window.innerHeight / dt
      vel += (instant - vel) * Math.min(1, dt * 10)
      lastY = y
      lastT = t
      xp.mutate({ progress: m.progress(), velocity: vel })
      raf = requestAnimationFrame(loop)
    }
    m.measure()
    raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => m.measure())
    ro.observe(document.body)
    const onMove = (e: PointerEvent) => xp.mutate({ pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) } })
    const onDown = () => xp.mutate({ pressing: true })
    const onUp = () => xp.mutate({ pressing: false })
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      xp.mutate({ pointer: { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (45 - e.beta) / 30)) } })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      lenis?.destroy()
      scroller.lenis = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [on])

  useEffect(() => {
    document.documentElement.dataset.world = on ? 'on' : 'off'
  }, [on])

  return on ? <WorldCanvas /> : null
}
