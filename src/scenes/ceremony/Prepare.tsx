'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { FrameStore } from '../gl'
import { createPacking, type PackPiece } from './packing'

const WRAP_FRAMES = 200
const WRAP_FPS = 40

/**
 * BEFORE CHECKOUT · PREPARED FOR YOU. The pieces in the bag, their own photographs, are
 * laid into an open Platera case on the counter and the case is sealed with a gold band
 * (packing.ts); then the box is wrapped by hand: the paper folds up flap by flap, the
 * satin draws round, the bow blooms and the "For you" tag drops on (the Blender render of
 * the gift, played in real time). Then the way on to checkout.
 */
type Stage = 'pack' | 'wrap' | 'ready'
export function Prepare({ pieces, names, total }: { pieces: PackPiece[]; names: string[]; total: string }) {
  const [stage, setStage] = useState<Stage>('pack')
  const packCanvas = useRef<HTMLCanvasElement>(null)
  const wrapCanvas = useRef<HTMLCanvasElement>(null)
  const frames = useRef<Promise<FrameStore | null> | null>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStage('ready')
    // The wrap loads while the packing plays.
    const portrait = innerWidth / innerHeight < 0.8
    const w = Math.max(innerWidth, innerHeight) * devicePixelRatio > 1300 ? 1600 : 1000
    frames.current = FrameStore.loadFirst((portrait ? ['gift_portrait', 'gift'] : ['gift']).map((d) => `/scenes/${d}/${w}`), WRAP_FRAMES, () => {})
  }, [])

  useEffect(() => {
    if (stage !== 'pack') return
    let api: ReturnType<typeof createPacking> | null = null
    try {
      api = createPacking(packCanvas.current!, pieces, () => setTimeout(() => setStage('wrap'), 500))
    } catch {
      setStage('wrap')
      return
    }
    const ro = new ResizeObserver(() => api?.resize())
    ro.observe(packCanvas.current!)
    return () => {
      ro.disconnect()
      api?.dispose()
    }
  }, [stage, pieces])

  // The wrap plays in real time, then holds on the tied gift.
  useEffect(() => {
    if (stage === 'pack') return
    const c = wrapCanvas.current!
    const ctx = c.getContext('2d')!
    let raf = 0
    let store: FrameStore | null = null
    let t0 = -1
    const draw = (bmp: ImageBitmap) => {
      const dpr = Math.min(devicePixelRatio, 2)
      if (c.width !== Math.round(c.clientWidth * dpr)) {
        c.width = Math.round(c.clientWidth * dpr)
        c.height = Math.round(c.clientHeight * dpr)
      }
      const s = Math.max(c.width / bmp.width, c.height / bmp.height)
      ctx.drawImage(bmp, (c.width - bmp.width * s) / 2, (c.height - bmp.height * s) / 2, bmp.width * s, bmp.height * s)
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!store) return
      if (t0 < 0) t0 = now
      const i = stage === 'ready' ? WRAP_FRAMES - 1 : Math.min(WRAP_FRAMES - 1, Math.floor(((now - t0) / 1000) * WRAP_FPS))
      const bmp = store.get(i)
      if (bmp) draw(bmp)
      if (stage === 'wrap' && i >= WRAP_FRAMES - 1) setStage('ready')
    }
    frames.current?.then((f) => {
      store = f
      if (!f) setStage('ready')
    })
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage])

  return (
    <div className="ceremony prepare" data-stage={stage}>
      <ol className="ceremony-steps" aria-label="Your order">
        {['Prepared for you', 'Wrapped by hand', 'Checkout'].map((s, i) => {
          const at = stage === 'pack' ? 0 : stage === 'wrap' ? 1 : 2
          return (
            <li key={s} data-on={at === i} data-done={at > i}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span> {s}
            </li>
          )
        })}
      </ol>

      {stage === 'pack' && (
        <section className="ceremony-act" aria-live="polite">
          <canvas ref={packCanvas} aria-hidden className="ceremony-canvas" />
          <div className="ceremony-caption">
            <p className="eyebrow">At the Gorai 1 counter</p>
            <h2 className="ceremony-title">Prepared <em className="accent">for you.</em></h2>
            <p className="ceremony-body">{names.join(' · ')}, laid into its Platera case and sealed with gold.</p>
          </div>
          <button type="button" className="ceremony-skip" onClick={() => setStage('wrap')}>Skip</button>
        </section>
      )}

      {stage !== 'pack' && (
        <section className="ceremony-act" aria-live="polite">
          <canvas ref={wrapCanvas} aria-hidden className="ceremony-canvas" />
          {stage === 'wrap' ? (
            <div key="wrap" className="ceremony-caption">
              <p className="eyebrow">By hand</p>
              <h2 className="ceremony-title">Wrapped <em className="accent">with care.</em></h2>
              <p className="ceremony-body">Our paper, folded flap by flap. Gold satin, a bow, and a card for your note.</p>
            </div>
          ) : (
            <div key="ready" className="ceremony-caption prepare-ready">
              <p className="eyebrow">Ready when you are</p>
              <h2 className="ceremony-title">For you, <em className="accent">from Platera.</em></h2>
              <p className="ceremony-body">
                <span className="num font-display text-step-3 text-espresso">{total}</span>
                <br />
                Insured delivery anywhere in India. Pay by UPI, card, net banking or wallet.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/checkout" className="btn btn-primary">Continue to checkout</Link>
                <Link href="/bag" className="btn btn-quiet">Back to the bag</Link>
              </div>
            </div>
          )}
          {stage === 'wrap' && <button type="button" className="ceremony-skip" onClick={() => setStage('ready')}>Skip</button>}
        </section>
      )}
    </div>
  )
}
