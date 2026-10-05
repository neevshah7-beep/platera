'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useManagedScene } from '../useManagedScene'
import { useEffect, useRef, useState } from 'react'
import { Viewing, type ViewingPiece } from '@/site/Viewing'
import { createCollection, type CollectionPiece } from './collection'

/**
 * SCENE 4 · THE COLLECTION (collection.ts). Pinned while the camera travels the length of
 * the silk. A hovered piece rises toward you and its name and today's price set beside it;
 * click to open it. Every piece is also a plain link below, for keyboards and readers.
 */
export function CollectionScene({ pieces, total, title, eyebrow = 'The collection', allHref = '/collection', chapterId = 'chapter-collection' }: { pieces: (CollectionPiece & { href: string })[]; total: number; title?: React.ReactNode; eyebrow?: string; allHref?: string; chapterId?: string }) {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [label, setLabel] = useState<{ slug: string; x: number; y: number } | null>(null)
  // The piece being viewed up close. Lives here, not in the moving caption, so the case
  // room's hover can never close it.
  const [viewing, setViewing] = useState<ViewingPiece | null>(null)
  const viewingRef = useRef(false)
  viewingRef.current = viewing !== null
  const api = useManagedScene(section, host, (c) => createCollection(c, pieces), [pieces])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = section.current!.getBoundingClientRect()
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      api.current?.setProgress(p)
      if (head.current) {
        const o = Math.max(0, Math.min(1, 1 - (p - 0.06) / 0.1))
        head.current.style.opacity = String(o)
        head.current.style.transform = `translateY(${(1 - o) * -24}px)`
      }
      if (viewingRef.current) return
      const s = api.current?.hoveredScreen() ?? null
      setLabel((l) => (l?.slug === s?.slug && Math.abs((l?.x ?? 0) - (s?.x ?? 0)) < 1 && Math.abs((l?.y ?? 0) - (s?.y ?? 0)) < 1 ? l : s))
    }
    raf = requestAnimationFrame(tick)
    const onMove = (e: PointerEvent) => {
      if (viewingRef.current) return
      const r = host.current!.getBoundingClientRect()
      api.current?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
    }
  }, [api])

  const piece = label ? pieces.find((p) => p.slug === label.slug) : null
  return (
    <section id={chapterId} ref={section} aria-labelledby="collection-title" className="relative" style={{ height: `${Math.max(300, pieces.length * 60)}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={host} className="absolute inset-0" style={{ cursor: piece ? 'pointer' : 'default' }} onClick={() => piece && router.push(piece.href)} />
        <div ref={head} className="collection-head pointer-events-none absolute px-[var(--gutter)]">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="collection-title" className="collection-title">{title ?? (<>Each piece, <em className="accent">in its own case.</em></>)}</h2>
        </div>
        {piece && label && (
          <div key={piece.slug} className="collection-label pointer-events-none absolute" style={{ left: Math.min(label.x, (typeof window !== "undefined" ? innerWidth : 1440) - 300), top: Math.max(label.y, 200) }}>
            <p className="font-display text-step-2 leading-tight">{piece.name}</p>
            <p className="num mt-1.5 text-step-0 font-medium text-gold-shadow">{piece.price}</p>
            <button type="button" className="collection-view pointer-events-auto" onClick={() => setViewing({ slug: piece.slug, name: piece.name, price: piece.price, href: piece.href, cutout: piece.base, photos: piece.originals ?? [], productId: piece.productId })}>
              View product
            </button>
          </div>
        )}
        <Link href={allHref} className="collection-all btn btn-primary">See all {total} pieces</Link>
      </div>
      <Viewing piece={viewing} onClose={() => setViewing(null)} />
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
