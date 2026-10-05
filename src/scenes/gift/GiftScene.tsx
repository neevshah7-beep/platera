'use client'

import { useEffect, useRef, useState } from 'react'
import { createGL, FrameStore, makeTexture, uploadImage } from '../gl'
import frag from './gift.frag.glsl'

const FRAMES = 200
const BOW = { landscape: [0.52, 0.66], portrait: [0.5, 0.6] } as const

/**
 * SCENE 5 · THE GIFT. Scroll wraps it: the paper folds up flap by flap, the ribbon draws
 * itself around, the bow blooms, the tag drops on. Once it is tied, pull the ribbon (drag
 * sideways anywhere on the gift) and the bow comes undone and the wrap unfolds as far as
 * you pull; let go and it springs back and wraps itself again.
 */
export function GiftScene() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tied, setTied] = useState(false)
  const [missing, setMissing] = useState(false)
  const drag = useRef({ active: false, x0: 0, pull: 0 })

  useEffect(() => {
    const c = canvas.current!
    const g = createGL(c, frag)
    if (!g) return
    const { gl, uniform, draw } = g
    let tex = makeTexture(gl)
    let shownBmp: ImageBitmap | null = null
    c.addEventListener('webglcontextlost', (e) => e.preventDefault())
    c.addEventListener('webglcontextrestored', () => {
      tex = makeTexture(gl)
      shownBmp = null
    })
    const portrait = innerWidth / innerHeight < 0.8
    const bow = portrait ? BOW.portrait : BOW.landscape
    let frames: FrameStore | null = null
    let visible = false
    let started = false
    let raf = 0
    let frame = 1
    let pull = 0 // spring-damped pull amount, 0..1 (how much of the wrap is undone)
    let pullV = 0
    let wasTied = false
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
          FrameStore.loadFirst((portrait ? ['gift_portrait', 'gift'] : ['gift']).map((d) => `/scenes/${d}/${Math.max(innerWidth, innerHeight) * devicePixelRatio > 1300 ? 1600 : 1000}`), FRAMES, () => {}).then((f) => {
            frames = f
            if (!f) setMissing(true)
          })
        }
      },
      { rootMargin: '120% 0px' },
    )
    io.observe(section.current!)

    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!visible || !frames) {
        if (!visible && frames && shownBmp) {
          frames.trim()
          shownBmp = null
        }
        return
      }
      const r = section.current!.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      // Scroll wraps the gift over the first 85% of the section; the rest is for pulling.
      const wrapped = Math.min(1, p / 0.85)
      const isTied = wrapped >= 0.999
      if (isTied !== wasTied) {
        wasTied = isTied
        setTied(isTied)
      }
      // The pull: while dragging, follow the hand; released, spring home (a little overshoot).
      const target = drag.current.active && isTied ? Math.min(1, Math.abs(drag.current.pull)) : 0
      pullV += (-120 * (pull - target) - 16 * pullV) * dt
      pull = Math.max(0, pull + pullV * dt)
      frame = 1 + (FRAMES - 1) * wrapped * (1 - pull * 0.55)

      const bmp = frames.get(Math.round(frame) - 1)
      if (bmp && bmp !== shownBmp) {
        uploadImage(gl, tex, bmp)
        shownBmp = bmp
      }
      gl.uniform1i(uniform('uFrame'), 0)
      gl.uniform2f(uniform('uRes'), c.width, c.height)
      gl.uniform2f(uniform('uImg'), frames.width, frames.height)
      gl.uniform1f(uniform('uPull'), Math.sign(drag.current.pull || 1) * pull)
      gl.uniform2f(uniform('uBow'), bow[0], bow[1])
      gl.uniform1f(uniform('uTime'), now / 1000)
      draw()
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

  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, x0: e.clientX, pull: 0 }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return
    drag.current.pull = (e.clientX - drag.current.x0) / (innerWidth * 0.45)
  }
  const onUp = () => (drag.current.active = false)

  return (
    <section id="chapter-gift" ref={section} aria-labelledby="gift-title" className="relative h-[240svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas
          ref={canvas}
          aria-hidden
          className={`absolute inset-0 h-full w-full touch-pan-y select-none ${tied ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {missing && (
          <picture className="absolute inset-0">
            <source media="(max-aspect-ratio: 4/5)" srcSet="/scenes/gift-poster-portrait.webp" />
            <img src="/scenes/gift-poster.webp" alt="A Platera gift box wrapped in espresso paper foiled in gold, tied with gold satin and a bow, with a For you tag" className="h-full w-full object-cover" />
          </picture>
        )}
        <div className="gift-copy pointer-events-none absolute px-[var(--gutter)]">
          <p className="eyebrow">The gift</p>
          <h2 id="gift-title" className="gift-title">Wrapped by hand, <em className="accent">for someone.</em></h2>
          <p className="gift-body measure">
            Every piece leaves in the Platera box, wrapped by hand in our paper, tied with satin, your note on the card. Sent insured, anywhere in India.
          </p>
        </div>
        <p className="gift-hint eyebrow" data-on={tied} aria-hidden>
          Pull the ribbon
        </p>
      </div>
    </section>
  )
}
