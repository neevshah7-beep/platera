'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createCollection, type CollectionApi, type CollectionPiece } from './collection'

/**
 * SCENE 4 · THE COLLECTION (collection.ts). Pinned while the camera travels the length of
 * the silk. A hovered piece rises toward you and its name and today's price set beside it;
 * click to open it. Every piece is also a plain link below, for keyboards and readers.
 */
export function CollectionScene({ pieces, total }: { pieces: (CollectionPiece & { href: string })[]; total: number }) {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<CollectionApi | null>(null)
  const head = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [label, setLabel] = useState<{ slug: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const c = canvas.current!
    let scene: CollectionApi | null = null
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !scene) scene = api.current = createCollection(c, pieces)
        else if (!e.isIntersecting && scene) {
          scene.dispose()
          scene = api.current = null
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(section.current!)
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      api.current?.setProgress(p)
      // The heading introduces the room, then withdraws as the first case opens.
      if (head.current) {
        const o = Math.max(0, Math.min(1, 1 - (p - 0.06) / 0.1))
        head.current.style.opacity = String(o)
        head.current.style.transform = `translateY(${(1 - o) * -24}px)`
      }
      const s = api.current?.hoveredScreen() ?? null
      setLabel((l) => (l?.slug === s?.slug && Math.abs((l?.x ?? 0) - (s?.x ?? 0)) < 1 ? l : s))
    }
    raf = requestAnimationFrame(tick)
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    }
    addEventListener('pointermove', onMove, { passive: true })
    const ro = new ResizeObserver(() => api.current?.resize())
    ro.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      removeEventListener('pointermove', onMove)
      scene?.dispose()
    }
  }, [pieces])

  const piece = label ? pieces.find((p) => p.slug === label.slug) : null
  return (
    <section id="chapter-collection" ref={section} aria-labelledby="collection-title" className="relative" style={{ height: `${Math.max(300, pieces.length * 60)}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ cursor: piece ? 'pointer' : 'default' }}
          onClick={() => piece && router.push(piece.href)}
        />
        <div ref={head} className="collection-head pointer-events-none absolute px-[var(--gutter)]">
          <p className="eyebrow">The collection</p>
          <h2 id="collection-title" className="collection-title">Laid out on silk, priced today.</h2>
        </div>
        {piece && label && (
          <div className="collection-label pointer-events-none absolute" style={{ left: label.x, top: label.y }}>
            <p className="font-display text-step-2 leading-tight">{piece.name}</p>
            <p className="num mt-1 text-step--1 text-muted">{piece.price}</p>
          </div>
        )}
        <Link href="/collection" className="collection-all btn btn-primary">See all {total} pieces</Link>
      </div>
      <ul className="sr-only">
        {pieces.map((p) => (
          <li key={p.slug}>
            <Link href={p.href}>{p.name}, {p.price}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
