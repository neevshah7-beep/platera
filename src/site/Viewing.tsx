'use client'

import Link from 'next/link'
import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { addToBag, type BagActionState } from '@/lib/cart/actions'
import { flyToBag } from './flyToBag'
import { scroller } from './SmoothScroll'

export type ViewingPiece = { slug: string; name: string; price: string; href: string; cutout: string; photos: string[]; productId?: string; start?: number }

const LOUPE = 200 // px
const ZOOM = 2.6

/**
 * THE VIEWING. A piece brought out for a closer look, the way it would be at the counter:
 *  · every original photograph, as taken at the store, presented as a mounted print that
 *    tilts a little toward your hand while a sheen of light crosses it;
 *  · a jeweller's loupe (a round lens in a gold bezel) magnifies wherever you point;
 *    on a phone, press and hold the photograph to raise the loupe under your finger;
 *  · the room takes its colour from the photograph being looked at;
 *  · photographs change with a sweep of light; the prints below lift when chosen;
 *  · Add to bag (the piece flies to the bag) and Open the piece, right beside it.
 */
export function Viewing({ piece, onClose }: { piece: ViewingPiece | null; onClose: () => void }) {
  if (!piece) return null
  return <ViewingInner key={`${piece.slug}-${piece.start ?? 0}`} piece={piece} onClose={onClose} />
}

function ViewingInner({ piece, onClose }: { piece: ViewingPiece; onClose: () => void }) {
  const photos = [...piece.photos.map((p) => ({ src: `${p}-1600.webp`, thumb: `${p}-800.webp`, label: 'As photographed at the store' })), { src: `${piece.cutout}-1600.webp`, thumb: `${piece.cutout}-960.webp`, label: 'The piece, on its own' }]
  const [i, setI] = useState(piece.start ?? 0)
  const [closing, setClosing] = useState(false)
  const print = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const loupe = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const holdTimer = useRef(0)
  const [state, action, pending] = useActionState<BagActionState, FormData>(async (prev, fd) => {
    const r = await addToBag(prev, fd)
    if (r?.ok && img.current) flyToBag(img.current)
    return r
  }, null)

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 420)
  }, [onClose])
  const go = useCallback((d: number) => setI((v) => (v + d + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    scroller.lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    addEventListener('keydown', key)
    return () => {
      removeEventListener('keydown', key)
      document.body.style.overflow = prev
      scroller.lenis?.start()
    }
  }, [close, go])

  // Tilt, sheen and loupe: written straight to the DOM (no React render per pointer move).
  const place = (clientX: number, clientY: number, showLoupe: boolean) => {
    const p = print.current, im = img.current, l = loupe.current
    if (!p || !im || !l) return
    const r = p.getBoundingClientRect()
    const x = (clientX - r.left) / r.width, y = (clientY - r.top) / r.height
    p.style.setProperty('--rx', `${(0.5 - y) * 7}deg`)
    p.style.setProperty('--ry', `${(x - 0.5) * 9}deg`)
    p.style.setProperty('--sx', `${x * 100}%`)
    p.style.setProperty('--sy', `${y * 100}%`)
    const ir = im.getBoundingClientRect()
    const inside = clientX >= ir.left && clientX <= ir.right && clientY >= ir.top && clientY <= ir.bottom
    l.style.opacity = showLoupe && inside ? '1' : '0'
    if (!inside) return
    const lx = clientX - ir.left, ly = clientY - ir.top
    l.style.transform = `translate(${clientX - LOUPE / 2}px, ${clientY - LOUPE / 2}px)`
    l.style.backgroundImage = `url(${photos[i].src})`
    l.style.backgroundSize = `${ir.width * ZOOM}px ${ir.height * ZOOM}px`
    l.style.backgroundPosition = `${-(lx * ZOOM - LOUPE / 2)}px ${-(ly * ZOOM - LOUPE / 2)}px`
  }
  const rest = () => {
    const p = print.current
    p?.style.setProperty('--rx', '0deg')
    p?.style.setProperty('--ry', '0deg')
    if (loupe.current) loupe.current.style.opacity = '0'
  }

  return (
    <div className="viewing" data-closing={closing} role="dialog" aria-modal="true" aria-label={`Viewing ${piece.name}`}>
      {/* The room takes the colour of the photograph. */}
      <div key={`bleed-${i}`} className="viewing-bleed" style={{ backgroundImage: `url(${photos[i].thumb})` }} aria-hidden />

      <div className="viewing-stage">
        <div
          ref={print}
          className="viewing-print"
          onPointerMove={(e) => e.pointerType === 'mouse' && place(e.clientX, e.clientY, true)}
          onPointerLeave={rest}
          onTouchStart={(e) => {
            const t = e.touches[0]
            touchX.current = t.clientX
            holdTimer.current = window.setTimeout(() => place(t.clientX, t.clientY, true), 260)
          }}
          onTouchMove={(e) => {
            const t = e.touches[0]
            if (loupe.current?.style.opacity === '1') place(t.clientX, t.clientY, true)
          }}
          onTouchEnd={(e) => {
            clearTimeout(holdTimer.current)
            const showing = loupe.current?.style.opacity === '1'
            rest()
            if (!showing && touchX.current !== null) {
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
            }
            touchX.current = null
          }}
        >
          <div key={i} className="viewing-photo">
            <img ref={img} src={photos[i].src} alt={`${piece.name}: ${photos[i].label.toLowerCase()}`} draggable={false} />
            <span className="viewing-sweep" aria-hidden />
          </div>
          <span className="viewing-sheen" aria-hidden />
        </div>
        <p className="viewing-caption">{photos[i].label}</p>
        {photos.length > 1 && (
          <ul className="viewing-prints">
            {photos.map((p, k) => (
              <li key={p.src} style={{ ['--tilt' as string]: `${(k % 2 ? 1 : -1) * (2 + (k % 3))}deg` }}>
                <button type="button" data-on={k === i} onClick={() => setI(k)} aria-label={`${p.label}, photograph ${k + 1}`}>
                  <img src={p.thumb} alt="" draggable={false} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="viewing-side">
        <p className="eyebrow">The viewing</p>
        <h2 className="viewing-name">{piece.name}</h2>
        <p className="num viewing-price">{piece.price}</p>
        <p className="viewing-note">Every photograph here is as taken at our counter in Gorai 1. Move over a photograph to look through the loupe.</p>
        <div className="viewing-actions">
          {piece.productId && (
            <form action={action}>
              <input type="hidden" name="productId" value={piece.productId} />
              <button type="submit" className="btn btn-primary w-full" disabled={pending}>
                {pending ? 'Setting it aside…' : 'Add to bag'}
              </button>
            </form>
          )}
          <Link href={piece.href} className="btn btn-quiet w-full">Open the piece</Link>
        </div>
        <p role="status" aria-live="polite" className="viewing-status">
          {state?.message}
          {state?.ok && (
            <>
              {' '}
              <Link href="/bag" className="link">View bag</Link>
            </>
          )}
        </p>
      </aside>

      <button type="button" className="viewing-close" onClick={close} aria-label="Close the viewing">Close</button>
      {photos.length > 1 && (
        <>
          <button type="button" className="viewing-arrow left" onClick={() => go(-1)} aria-label="Previous photograph">‹</button>
          <button type="button" className="viewing-arrow right" onClick={() => go(1)} aria-label="Next photograph">›</button>
        </>
      )}
      <div ref={loupe} className="viewing-loupe" aria-hidden />
    </div>
  )
}
