'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The original photographs of a piece, exactly as taken at the store: full-screen, one at
 * a time, with thumbnails. Click (or tap) a photograph to look closer: it magnifies 2.5×
 * and follows the pointer, like holding a loupe over it. Arrow keys, swipe and Esc work.
 */
export function OriginalsViewer({ name, photos, open, start = 0, onClose }: { name: string; photos: string[]; open: boolean; start?: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const touchX = useRef<number | null>(null)
  const go = useCallback((d: number) => {
    setZoom(false)
    setI((v) => (v + d + photos.length) % photos.length)
  }, [photos.length])

  useEffect(() => {
    if (open) setI(start)
  }, [open, start])

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', key)
      document.body.style.overflow = prev
    }
  }, [open, go, onClose])

  if (!open || !photos.length) return null
  const src = photos[i]
  return (
    <div className="originals" role="dialog" aria-modal="true" aria-label={`Original photographs of ${name}`}>
      <div className="originals-bar">
        <div>
          <p className="eyebrow">As photographed at the store</p>
          <p className="originals-name">{name}</p>
        </div>
        <p className="num originals-count">{i + 1} / {photos.length}</p>
        <button type="button" className="originals-close" onClick={onClose} aria-label="Close">Close</button>
      </div>
      <div
        className="originals-stage"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 50 && !zoom) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        {photos.length > 1 && (
          <button type="button" className="originals-arrow left" onClick={() => go(-1)} aria-label="Previous photograph">‹</button>
        )}
        <div
          className="originals-frame"
          data-zoom={zoom}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
            setZoom((z) => !z)
          }}
          onPointerMove={(e) => {
            if (!zoom) return
            const r = e.currentTarget.getBoundingClientRect()
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
          }}
        >
          <img
            key={src}
            src={`${src}-1600.webp`}
            alt={`${name}, original photograph ${i + 1} of ${photos.length}`}
            style={{ transformOrigin: origin }}
            draggable={false}
          />
        </div>
        {photos.length > 1 && (
          <button type="button" className="originals-arrow right" onClick={() => go(1)} aria-label="Next photograph">›</button>
        )}
      </div>
      <p className="originals-hint">{zoom ? 'Move to look around · click to step back' : 'Click the photograph to look closer'}</p>
      {photos.length > 1 && (
        <ul className="originals-thumbs">
          {photos.map((p, k) => (
            <li key={p}>
              <button type="button" data-on={k === i} onClick={() => (setZoom(false), setI(k))} aria-label={`Photograph ${k + 1}`}>
                <img src={`${p}-800.webp`} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** A button that opens the viewer; used on the piece page and in the case room. */
export function OriginalsButton({ name, photos, className = '', label = 'See the original photographs' }: { name: string; photos: string[]; className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  if (!photos.length) return null
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label} <span className="num">({photos.length})</span>
      </button>
      <OriginalsViewer name={name} photos={photos} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
