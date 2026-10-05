'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPacking, type PackPiece, type PackingApi } from './packing'

/**
 * BEFORE CHECKOUT · PREPARED AND PACKED. One continuous scene on the counter (packing.ts):
 * the pieces in the bag, their own photographs, are laid into the Platera case and the case
 * is sealed with gold; then the case goes into the Platera courier box, tissue, seal, flaps,
 * tape and label. Then the way on to checkout, over the packed box.
 */
type Stage = 'case' | 'courier' | 'ready'
export function Prepare({ pieces, names, total }: { pieces: PackPiece[]; names: string[]; total: string }) {
  const [stage, setStage] = useState<Stage>('case')
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<PackingApi | null>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStage('ready')
    try {
      api.current = createPacking(
        canvas.current!,
        pieces,
        () => setTimeout(() => setStage('ready'), 300),
        (p) => p === 'courier' && setStage((s) => (s === 'ready' ? s : 'courier')),
      )
    } catch {
      setStage('ready')
      return
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) api.current.skip()
    const ro = new ResizeObserver(() => api.current?.resize())
    ro.observe(canvas.current!)
    return () => {
      ro.disconnect()
      api.current?.dispose()
      api.current = null
    }
  }, [pieces])

  const at = stage === 'case' ? 0 : stage === 'courier' ? 1 : 2
  return (
    <div className="ceremony prepare" data-stage={stage}>
      <ol className="ceremony-steps" aria-label="Your order">
        {['Prepared for you', 'Packed to travel', 'Checkout'].map((s, i) => (
          <li key={s} data-on={at === i} data-done={at > i}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span> {s}
          </li>
        ))}
      </ol>
      <section className="ceremony-act" aria-live="polite">
        <canvas ref={canvas} aria-hidden className="ceremony-canvas" />
        {stage === 'case' && (
          <div key="case" className="ceremony-caption">
            <p className="eyebrow">At the Gorai 1 counter</p>
            <h2 className="ceremony-title">Prepared <em className="accent">for you.</em></h2>
            <p className="ceremony-body">{names.join(' · ')}, laid into its Platera case and sealed with gold.</p>
          </div>
        )}
        {stage === 'courier' && (
          <div key="courier" className="ceremony-caption">
            <p className="eyebrow">Into the courier box</p>
            <h2 className="ceremony-title">Packed <em className="accent">to travel.</em></h2>
            <p className="ceremony-body">Bedded in tissue, sealed with our gold P, taped and labelled. Insured from our counter to your door.</p>
          </div>
        )}
        {stage === 'ready' && (
          <div key="ready" className="ceremony-caption prepare-ready">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="ceremony-title">Packed, <em className="accent">and waiting for you.</em></h2>
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
        {stage !== 'ready' && (
          <button type="button" className="ceremony-skip" onClick={() => { api.current?.skip(); setStage('ready') }}>Skip</button>
        )}
      </section>
    </div>
  )
}
