'use client'

import { useEffect, useRef, useState } from 'react'
import { createGL, FrameStore, makeTexture, uploadImage } from '../gl'
import frag from './stamp.frag.glsl'

const FRAMES = 72
const HOLD_END = 40 // punch fully drawn up
const STRIKE = 46 // the frame of impact
const FPS = 30
const CHARGE_S = 1.5 // seconds of holding to draw the punch all the way up
// Where the die meets the bar in each framing (frame uv, y up), measured from the renders.
const IMPACT = { landscape: [0.5, 0.31], portrait: [0.5, 0.4] } as const

type Phase = 'idle' | 'holding' | 'easing' | 'committing' | 'striking' | 'struck'

/**
 * SCENE 3 · THE STAMP. The only scene you operate with your hand: press and hold and the
 * punch is drawn up under tension; let go and it strikes. Released before it is fully up,
 * it sinks back. Visitors who never press see it strike once on its own as they pass.
 */
export function StampScene() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const control = useRef({ hold: false, auto: false })

  useEffect(() => {
    const c = canvas.current!
    const g = createGL(c, frag)
    if (!g) return
    const { gl, uniform, draw } = g
    let tex = makeTexture(gl)
    // If the GPU drops the context (memory pressure), rebuild on restore instead of going black.
    const onLost = (e: Event) => e.preventDefault()
    const onRestored = () => {
      tex = makeTexture(gl)
      shownBmp = null
    }
    c.addEventListener('webglcontextlost', onLost)
    c.addEventListener('webglcontextrestored', onRestored)
    const portrait = innerWidth / innerHeight < 0.8
    const dir = portrait ? 'stamp_portrait' : 'stamp'
    const impact = portrait ? IMPACT.portrait : IMPACT.landscape
    let frames: FrameStore | null = null
    let shownBmp: ImageBitmap | null = null
    let visible = false
    let raf = 0
    let frame = 1
    let hold = 0
    let state: Phase = 'idle'
    let strikeAt = -1
    let started = false
    const set = (p: Phase) => {
      if (state !== p) {
        state = p
        setPhase(p)
      }
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      c.width = Math.round(c.clientWidth * dpr)
      c.height = Math.round(c.clientHeight * dpr)
      gl.viewport(0, 0, c.width, c.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible && !started) {
          started = true
          FrameStore.load(`/scenes/${dir}/${innerWidth * devicePixelRatio > 1300 ? 1600 : 1000}`, FRAMES, () => {}).then((f) => (frames = f))
        }
      },
      { rootMargin: '120% 0px' },
    )
    io.observe(section.current!)

    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      // Real elapsed time (not frame count), so the charge feels the same on any device.
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      if (!visible || !frames) return
      const t = now / 1000
      const ctl = control.current

      // Visitors who never press see it strike once, as they reach the middle of the scene.
      if (!ctl.auto && state === 'idle') {
        const r = section.current!.getBoundingClientRect()
        if (r.top < -innerHeight * 0.45) {
          ctl.auto = true
          ctl.hold = true
          setTimeout(() => (control.current.hold = false), CHARGE_S * 1000 + 450)
        }
      }

      if (state === 'idle' || state === 'holding' || state === 'easing') {
        if (ctl.hold) {
          set('holding')
          hold = Math.min(1, hold + dt / CHARGE_S)
        } else if (hold >= 0.6 && state === 'holding') {
          // Released with most of the draw: the hand flicks the last of it and lets fly.
          set('committing')
        } else {
          hold = Math.max(0, hold - dt / (CHARGE_S * 0.6))
          set(hold > 0 ? 'easing' : 'idle')
        }
        // Ease the drawn-up curve so the punch decelerates near the top, like a hand tiring.
        frame = 1 + (HOLD_END - 1) * (1 - (1 - hold) ** 1.6)
      }
      if (state === 'committing') {
        hold = Math.min(1, hold + dt / 0.14)
        frame = 1 + (HOLD_END - 1) * (1 - (1 - hold) ** 1.6)
        if (hold >= 1) set('striking')
      }
      if (state === 'striking') {
        frame = Math.min(FRAMES, frame + dt * FPS)
        if (frame >= STRIKE && strikeAt < 0) strikeAt = t
        if (frame >= FRAMES) set('struck')
      }

      const idx = Math.max(0, Math.min(FRAMES - 1, Math.round(frame) - 1))
      const bmp = frames.get(idx)
      if (bmp && bmp !== shownBmp) {
        uploadImage(gl, tex, bmp)
        shownBmp = bmp
      }
      gl.uniform1i(uniform('uFrame'), 0)
      gl.uniform2f(uniform('uRes'), c.width, c.height)
      gl.uniform2f(uniform('uImg'), frames.width, frames.height)
      gl.uniform2f(uniform('uImpact'), impact[0], impact[1])
      gl.uniform1f(uniform('uHold'), state === 'striking' || state === 'struck' ? 0 : hold)

      gl.uniform1f(uniform('uStrike'), strikeAt < 0 ? -1 : t - strikeAt)
      gl.uniform1f(uniform('uTime'), t)
      gl.uniform1f(uniform('uDieRadius'), portrait ? 0.07 : 0.085)
      draw()

      // After the strike settles, a further press strikes again from the top.
      if (state === 'struck' && ctl.hold) {
        hold = 0
        frame = 1
        strikeAt = -1
        set('holding')
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      frames?.dispose()
      g.dispose()
    }
  }, [])

  const down = () => (control.current.hold = true)
  const up = () => (control.current.hold = false)

  return (
    <section id="chapter-hallmark" ref={section} aria-labelledby="stamp-title" className="relative h-[220svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
        />
        <div className="stamp-copy pointer-events-none absolute px-[var(--gutter)]" data-struck={phase === 'struck'}>
          <p className="eyebrow">The hallmark</p>
          <h2 id="stamp-title" className="stamp-title">Struck into the metal.</h2>
          <p className="stamp-body measure">
            Every Platera piece carries the BIS hallmark: the purity, 925, and a unique HUID you can check yourself on the BIS CARE app.
          </p>
        </div>
        <button
          type="button"
          className="stamp-hold"
          data-phase={phase}
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && down()}
          onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && up()}
        >
          <span className="stamp-ring" aria-hidden />
          <span>{phase === 'struck' ? 'Hold to strike again' : phase === 'holding' ? 'Keep holding' : 'Press and hold to strike'}</span>
        </button>
      </div>
    </section>
  )
}
