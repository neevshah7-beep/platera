'use client'

import { useEffect, useRef } from 'react'
import { createGL, FrameStore, makeTexture, uploadImage } from '../gl'
import { entry, useEntry } from '@/site/entry'
import frag from './fall.frag.glsl'

const FRAMES = 150
const LANDED = 118 // the ring has settled; scroll takes over from here
const FPS = 30

/**
 * SCENE 1 · THE FALL. A photoreal Cycles render (src/pipeline/blender/scene_fall.py),
 * 150 frames, composited live in WebGL2 (fall.frag.glsl). On entering, the fall plays in
 * real time; then scroll scrubs the settle and the light sweep. The pointer is a warm
 * hand-held lamp over the silk and gold; pressing makes the diamond flare.
 */
export function FallScene({ onLanded, children }: { onLanded?: () => void; children?: React.ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const section = useRef<HTMLElement>(null)
  const entered = useEntry((s) => s.entered)
  const enteredRef = useRef(false)
  enteredRef.current = entered

  useEffect(() => {
    const c = canvas.current!
    let g: ReturnType<typeof createGL>
    try {
      g = createGL(c, frag)
    } catch (e) {
      console.error(e)
      return
    }
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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const width = Math.max(innerWidth, innerHeight) * devicePixelRatio > 1300 ? 1600 : 1000
    let frames: FrameStore | null = null
    let shownBmp: ImageBitmap | null = null
    let introStart = -1
    let landedFired = false
    let visible = true
    let raf = 0
    const ptr = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45, lamp: 0, lampT: 0, lastMove: -1e9, press: 0, pressT: 0 }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      c.width = Math.round(c.clientWidth * dpr)
      c.height = Math.round(c.clientHeight * dpr)
      gl.viewport(0, 0, c.width, c.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(c)

    FrameStore.loadFirst(innerWidth / innerHeight < 0.8 ? [`/scenes/fall_portrait/${width}`, `/scenes/fall/${width}`] : [`/scenes/fall/${width}`], FRAMES, (p) => entry.set({ progress: p })).then((f) => {
      frames = f
      entry.set({ ready: true })
    })

    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      ptr.tx = (e.clientX - r.left) / r.width
      ptr.ty = 1 - (e.clientY - r.top) / r.height
      ptr.lastMove = performance.now()
    }
    const onDown = () => (ptr.pressT = 1)
    const onUp = () => (ptr.pressT = 0)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    addEventListener('pointerup', onUp, { passive: true })

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || !frames) {
        if (!visible && frames && shownBmp) {
          frames.trim()
          shownBmp = null
        }
        return
      }
      const t = now / 1000

      // Which frame: the fall plays in real time once entered; then scroll scrubs the settle.
      let f = 0
      if (enteredRef.current) {
        // Returning visitors find the ring already resting on the silk.
        // The ring begins its fall as the clouds start to part (CloudVeil).
        if (introStart < 0) introStart = entry.get().returning ? now - (LANDED / FPS) * 1000 : now + 1150
        const played = reduced ? LANDED : Math.max(0, Math.min(LANDED, ((now - introStart) / 1000) * FPS))
        const sec = section.current!
        const scrolled = Math.max(0, -sec.getBoundingClientRect().top) / Math.max(1, innerHeight)
        const scrub = Math.min(1, scrolled / 1.1)
        f = played < LANDED ? played : LANDED + scrub * (FRAMES - 1 - LANDED)
        if (played >= LANDED && !landedFired) {
          landedFired = true
          onLanded?.()
        }
      }
      const idx = Math.max(0, Math.min(FRAMES - 1, Math.round(f)))
      const bmp = frames.get(idx)
      if (bmp && bmp !== shownBmp) {
        uploadImage(gl, tex, bmp)
        shownBmp = bmp
      }

      // The lamp: follows the pointer on a soft spring; when the pointer rests (or on touch)
      // it drifts on its own slow path so the scene is never still.
      const idle = now - ptr.lastMove > 2600
      if (idle) {
        ptr.tx = 0.5 + Math.sin(t * 0.23) * 0.22
        ptr.ty = 0.5 + Math.sin(t * 0.17 + 1.2) * 0.14
      }
      ptr.lampT = idle ? 0.55 : 1
      const k = 1 - Math.exp(-(1 / 60) * 6)
      ptr.x += (ptr.tx - ptr.x) * k
      ptr.y += (ptr.ty - ptr.y) * k
      ptr.lamp += (ptr.lampT - ptr.lamp) * k * 0.5
      ptr.press += (ptr.pressT - ptr.press) * (ptr.pressT > ptr.press ? 0.25 : 0.05)

      gl.uniform1i(uniform('uFrame'), 0)
      gl.uniform2f(uniform('uRes'), c.width, c.height)
      gl.uniform2f(uniform('uImg'), frames.width, frames.height)
      gl.uniform2f(uniform('uPointer'), ptr.x, ptr.y)
      gl.uniform1f(uniform('uLamp'), enteredRef.current ? ptr.lamp : 0)
      gl.uniform1f(uniform('uPress'), ptr.press)
      gl.uniform1f(uniform('uTime'), t)
      gl.uniform1f(uniform('uFade'), 1)
      draw()
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
      frames?.dispose()
      g?.dispose()
    }
  }, [onLanded])

  return (
    <section id="chapter-fall" ref={section} aria-label="The fall" className="relative h-[180svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {children}
      </div>
    </section>
  )
}
