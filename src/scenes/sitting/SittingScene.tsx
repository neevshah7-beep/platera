'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scroller } from '@/site/SmoothScroll'

/**
 * SCENE · THE SITTING. The Platera campaign, hung as an exhibition you walk along.
 * A long gallery wall stands at an angle in the room; scroll walks you beside it, so the
 * prints ahead are small and far and the ones you pass are large and near. Each look has
 * its own room and wall colour (Rouge, Saffron, Noir); a studio strobe fires as you step
 * into each. Every print is framed, lit from above by a brass picture light, and some
 * stand proud of the wall. Labels sit beside them as in a gallery. The room leans with
 * your hand; a print you point at lifts toward you, and a click brings it out full size.
 * At the end of the walk the three looks fan out together, like proofs on the table.
 */

type Print = { id: string; caption: string }
type Column = { prints: Print[]; depth: number } // one large print, or two small stacked
type Room = { numeral: string; title: string; line: string; wall: string; hero: Print; columns: Column[] }

const ROOMS: Room[] = [
  {
    numeral: 'I', title: 'Rouge', line: 'Merreeda, in red satin and silver', wall: '#ecd0bb',
    hero: { id: 'merreeda-1', caption: 'Rouge, the full look' },
    columns: [
      { prints: [{ id: 'merreeda-2', caption: 'Long drops and the solitaire' }], depth: 40 },
      { prints: [{ id: 'merreeda-3', caption: 'The drop earring, close' }, { id: 'merreeda-4', caption: 'The solitaire pendant' }], depth: 0 },
      { prints: [{ id: 'merreeda-6', caption: 'The wishbone ring' }], depth: 70 },
      { prints: [{ id: 'merreeda-10', caption: 'A line of stones, wrist-close' }, { id: 'merreeda-8', caption: 'The statement ring' }], depth: 20 },
      { prints: [{ id: 'merreeda-13', caption: 'Payal, two rows' }], depth: 50 },
    ],
  },
  {
    numeral: 'II', title: 'Saffron', line: 'Aarya, in saffron and garnet', wall: '#efd6a2',
    hero: { id: 'aarya-1', caption: 'Saffron, the full look' },
    columns: [
      { prints: [{ id: 'aarya-2', caption: 'The fish pendant, worn' }], depth: 50 },
      { prints: [{ id: 'aarya-5', caption: 'Swan studs' }, { id: 'aarya-6', caption: 'The fish pendant, close' }], depth: 10 },
      { prints: [{ id: 'aarya-3', caption: 'A glance, and a swan' }], depth: 70 },
      { prints: [{ id: 'aarya-9', caption: 'Bracelet in colour' }, { id: 'aarya-12', caption: 'Payal, in step' }], depth: 25 },
    ],
  },
  {
    numeral: 'III', title: 'Noir', line: 'Aarya, in black, set with light', wall: '#d9c09a',
    hero: { id: 'aarya-14', caption: 'Noir, the full look' },
    columns: [
      { prints: [{ id: 'aarya-18', caption: 'The bow drop' }], depth: 60 },
      { prints: [{ id: 'aarya-15', caption: 'Silver against black' }, { id: 'aarya-19', caption: 'A leaping pendant' }], depth: 15 },
      { prints: [{ id: 'aarya-22', caption: 'The flower ring' }], depth: 70 },
      { prints: [{ id: 'aarya-21', caption: 'Hearts, stacked' }, { id: 'aarya-24', caption: 'The wave cuff' }], depth: 30 },
    ],
  },
]
const PRINTS: (Print & { room: number })[] = ROOMS.flatMap((r, k) => [r.hero, ...r.columns.flatMap((c) => c.prints)].map((p) => ({ ...p, room: k })))

const WALK = 0.84 // share of the section spent walking the wall; the rest is the finale

export function SittingScene() {
  const section = useRef<HTMLElement>(null)
  const wall = useRef<HTMLDivElement>(null)
  const strobe = useRef<HTMLDivElement>(null)
  const finale = useRef<HTMLDivElement>(null)
  const rooms = useRef<(HTMLDivElement | null)[]>([])
  const [near, setNear] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    const sec = section.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = false
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) setNear(true)
    }, { rootMargin: '150% 0px' })
    io.observe(sec)

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / innerWidth - 0.5
      pointer.y = e.clientY / innerHeight - 0.5
    }
    addEventListener('pointermove', onMove, { passive: true })

    // The wall's length and where each room begins, measured once laid out.
    let length = 0
    let starts: number[] = []
    const measure = () => {
      const w = wall.current
      if (!w) return
      length = w.scrollWidth
      starts = rooms.current.map((r) => r?.offsetLeft ?? 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wall.current) ro.observe(wall.current)

    let lastRoom = -1
    let lastKey = ''
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible || !wall.current) return
      const r = sec.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      pointer.sx += (pointer.x - pointer.sx) * 0.06
      pointer.sy += (pointer.y - pointer.sy) * 0.06
      const walk = Math.min(1, p / WALK)
      const narrow = innerWidth < 768
      // Walk from the start of the wall to its end; the wall stands angled away to the right.
      // The walk starts with the wall's beginning near the left edge and ends at its far end.
      const x0 = -innerWidth * (narrow ? 0.08 : 0.24)
      const x = x0 + walk * (Math.max(0, length - innerWidth * (narrow ? 0.7 : 0.55)) - x0)
      const key = `${x.toFixed(1)}|${pointer.sx.toFixed(4)}|${pointer.sy.toFixed(4)}`
      if (key !== lastKey) {
        lastKey = key
        const ang = (narrow ? 9 : 17) + pointer.sx * 4
        wall.current.style.transform = `rotateY(${ang}deg) rotateX(${-pointer.sy * 2}deg) translate3d(${-x}px,0,0)`
      }
      // Which room you are standing in: the strobe fires as you step into each.
      const at = x + innerWidth * 0.35
      let room = 0
      starts.forEach((s, i) => i > 0 && at >= s && (room = i - 1))
      if (room !== lastRoom) {
        if (lastRoom !== -1 && !reduced && strobe.current) {
          strobe.current.classList.remove('fire')
          void strobe.current.offsetWidth
          strobe.current.classList.add('fire')
        }
        lastRoom = room
        sec.dataset.look = String(room)
      }
      const f = Math.min(1, Math.max(0, ((p - WALK) / (1 - WALK)) * 1.25))
      sec.style.setProperty('--fin', f.toFixed(4))
      sec.style.setProperty('--intro', Math.max(0, 1 - walk / 0.05).toFixed(4))
      if (finale.current) finale.current.style.visibility = f > 0.001 ? 'visible' : 'hidden'
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      removeEventListener('pointermove', onMove)
    }
  }, [])

  const show = useCallback((id: string) => setOpen(PRINTS.findIndex((p) => p.id === id)), [])
  let n = 0
  const frame = (pr: Print, size: 'hero' | 'large' | 'small', depth: number) => {
    n += 1
    const num = String(n).padStart(2, '0')
    return (
      <figure key={pr.id} className={`sit-frame sit-${size}`} style={{ ['--z' as string]: `${depth}px` }}>
        <span className="sit-lamp" aria-hidden />
        <button type="button" className="sit-print" onClick={() => show(pr.id)} aria-label={`Open the photograph: ${pr.caption}`}>
          {near && <img src={`/media/shoot/${pr.id}-900.webp`} alt="" decoding="async" draggable={false} />}
          <span className="sit-sheen" aria-hidden />
        </button>
        <figcaption className="sit-label">
          <span className="num">{num}</span> {pr.caption}
        </figcaption>
      </figure>
    )
  }

  return (
    <section id="chapter-sitting" ref={section} aria-labelledby="sitting-title" className="sitting relative h-[640svh]" data-look="0">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="sit-floor" aria-hidden />
        <div className="sit-stage">
          <div ref={wall} className="sit-wall">
            <div ref={(el) => void (rooms.current[0] = el)} className="sit-room sit-intro" style={{ ['--wall' as string]: '#f2e2c4' }}>
              <div className="sit-panel">
                <p className="eyebrow">The sitting · Autumn 2026</p>
                <h2 id="sitting-title" className="sit-title">Worn, <em className="accent">and photographed.</em></h2>
                <p className="sit-intro-body">Three looks from the Platera sitting, hung for you. Walk the wall; tap any print to see it close.</p>
              </div>
            </div>
            {ROOMS.map((room, k) => (
              <div key={room.title} ref={(el) => void (rooms.current[k + 1] = el)} className="sit-room" style={{ ['--wall' as string]: room.wall }}>
                <div className="sit-panel sit-look">
                  <p className="sit-numeral">Look {room.numeral}</p>
                  <p className="sit-look-title font-display">{room.title}</p>
                  <p className="sit-look-line">{room.line}</p>
                </div>
                {frame(room.hero, 'hero', 30)}
                {room.columns.map((col, c) => (
                  <div key={c} className="sit-col" style={{ ['--z' as string]: `${col.depth}px` }}>
                    {col.prints.map((pr) => frame(pr, col.prints.length > 1 ? 'small' : 'large', col.depth))}
                  </div>
                ))}
              </div>
            ))}
            <div ref={(el) => void (rooms.current[ROOMS.length + 1] = el)} className="sit-room sit-end" style={{ ['--wall' as string]: '#e6cfa4' }} />
          </div>
        </div>

        <p className="sit-looks px-[var(--gutter)]" aria-hidden>
          {ROOMS.map((l, k) => (
            <span key={l.title} data-k={k}>{l.numeral} · {l.title}</span>
          ))}
        </p>

        <div ref={finale} className="sit-finale">
          <div className="sit-fan">
            {ROOMS.map((l, k) => (
              <button key={l.title} type="button" className="sit-proof" style={{ ['--k' as string]: k - 1 }} onClick={() => show(l.hero.id)} aria-label={`Open the ${l.title} look`}>
                <span className="sit-proof-mount">
                  {near && <img src={`/media/shoot/${l.hero.id}-900.webp`} alt="" decoding="async" draggable={false} />}
                  <span className="sit-proof-title">{l.numeral} · {l.title}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="sit-finale-copy px-[var(--gutter)]">
            <p className="sit-finale-line">Three looks. <em className="accent">One house.</em></p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/collection" className="btn btn-primary">Find these pieces</Link>
              <a href="#chapter-counter" className="btn btn-quiet" onClick={(e) => { e.preventDefault(); scroller.lenis?.scrollTo('#chapter-counter', { duration: 2.2 }) }}>Try them on at the counter</a>
            </div>
          </div>
        </div>

        <div ref={strobe} className="sit-strobe" aria-hidden />
      </div>
      {open !== null && <SittingPrint index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  )
}

/** A print brought out full size: the strobe fires, the photograph develops in. */
function SittingPrint({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 380)
  }, [onClose])
  const go = useCallback((d: number) => onIndex((index + d + PRINTS.length) % PRINTS.length), [index, onIndex])
  useEffect(() => {
    scroller.lenis?.stop()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    addEventListener('keydown', key)
    return () => {
      removeEventListener('keydown', key)
      scroller.lenis?.start()
    }
  }, [close, go])
  const p = PRINTS[index]
  const look = ROOMS[p.room]
  return (
    <div className="sit-lightbox" data-closing={closing} role="dialog" aria-modal="true" aria-label={p.caption} onClick={close}>
      <div key={p.id} className="sit-lightbox-print" onClick={(e) => e.stopPropagation()}>
        <img src={`/media/shoot/${p.id}-1600.webp`} alt={`Platera campaign, look ${look.title}: ${p.caption}`} draggable={false} />
      </div>
      <div className="sit-lightbox-caption" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Look {look.numeral} · {look.title}</p>
        <p className="sit-lightbox-title">{p.caption}</p>
      </div>
      <button type="button" className="viewing-close" onClick={close}>Close</button>
      <button type="button" className="sit-arrow left" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Previous photograph">‹</button>
      <button type="button" className="sit-arrow right" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Next photograph">›</button>
      <span key={`f-${p.id}`} className="sit-lightbox-flash" aria-hidden />
    </div>
  )
}
