'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scroller } from '@/site/SmoothScroll'

/**
 * SCENE · THE SITTING. The Platera campaign, walked through rather than scrolled past.
 * The photographs of the sitting hang in a deep studio; scroll moves you forward through
 * them, one look after another (Rouge, Saffron, Noir), and a studio strobe fires as
 * you step into each new look. The room leans with your hand; a print you point at comes
 * toward you, and a click brings it out full size. At the end of the walk the three looks
 * fan out together, like proofs laid on the table.
 */

type Print = { kind: 'print'; id: string; caption: string; full?: boolean }
type Card = { kind: 'card'; numeral: string; title: string; line: string; look: number }
type Node = Print | Card

const LOOKS = [
  { numeral: 'I', title: 'Rouge', line: 'Merreeda, in red satin and silver', portrait: 'merreeda-1' },
  { numeral: 'II', title: 'Saffron', line: 'Aarya, in saffron and garnet', portrait: 'aarya-1' },
  { numeral: 'III', title: 'Noir', line: 'Aarya, in black, set with light', portrait: 'aarya-14' },
]

const NODES: Node[] = [
  { kind: 'card', numeral: LOOKS[0].numeral, title: LOOKS[0].title, line: LOOKS[0].line, look: 0 },
  { kind: 'print', id: 'merreeda-1', caption: 'Rouge · the full look', full: true },
  { kind: 'print', id: 'merreeda-2', caption: 'Long drops and the solitaire' },
  { kind: 'print', id: 'merreeda-3', caption: 'The drop earring, close' },
  { kind: 'print', id: 'merreeda-4', caption: 'The solitaire pendant' },
  { kind: 'print', id: 'merreeda-6', caption: 'The wishbone ring' },
  { kind: 'print', id: 'merreeda-10', caption: 'A line of stones, wrist-close' },
  { kind: 'print', id: 'merreeda-8', caption: 'The statement ring' },
  { kind: 'print', id: 'merreeda-13', caption: 'Payal, two rows' },
  { kind: 'card', numeral: LOOKS[1].numeral, title: LOOKS[1].title, line: LOOKS[1].line, look: 1 },
  { kind: 'print', id: 'aarya-1', caption: 'Saffron · the full look', full: true },
  { kind: 'print', id: 'aarya-2', caption: 'The fish pendant, worn' },
  { kind: 'print', id: 'aarya-5', caption: 'Swan studs' },
  { kind: 'print', id: 'aarya-6', caption: 'The fish pendant, close' },
  { kind: 'print', id: 'aarya-3', caption: 'A glance, and a swan' },
  { kind: 'print', id: 'aarya-9', caption: 'Bracelet in colour' },
  { kind: 'print', id: 'aarya-12', caption: 'Payal, in step' },
  { kind: 'card', numeral: LOOKS[2].numeral, title: LOOKS[2].title, line: LOOKS[2].line, look: 2 },
  { kind: 'print', id: 'aarya-14', caption: 'Noir · the full look', full: true },
  { kind: 'print', id: 'aarya-18', caption: 'The bow drop' },
  { kind: 'print', id: 'aarya-15', caption: 'Silver against black' },
  { kind: 'print', id: 'aarya-19', caption: 'A leaping pendant' },
  { kind: 'print', id: 'aarya-21', caption: 'Hearts, stacked' },
  { kind: 'print', id: 'aarya-22', caption: 'The flower ring' },
  { kind: 'print', id: 'aarya-24', caption: 'The wave cuff' },
]
const PRINTS = NODES.filter((n): n is Print => n.kind === 'print')
// Depth of each node, in hanging-slots: a look's card hangs alone, with air after it.
const SLOTS: number[] = []
NODES.reduce((z, n) => (SLOTS.push(z), z + (n.kind === 'card' ? 2.2 : 1)), 0)
const LAST = SLOTS[SLOTS.length - 1]

const WALK = 0.84 // share of the section spent walking; the rest is the finale

export function SittingScene() {
  const section = useRef<HTMLElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const strobe = useRef<HTMLDivElement>(null)
  const finale = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
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

    let lastLook = -1
    let lastKey = ''
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const r = sec.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      pointer.sx += (pointer.x - pointer.sx) * 0.06
      pointer.sy += (pointer.y - pointer.sy) * 0.06
      const narrow = innerWidth < 768
      const D = narrow ? 420 : 540 // depth between hanging prints, px
      const walk = Math.min(1, p / WALK)
      // The walk begins a little way back, so the first look's card is seen hanging ahead.
      const LEAD = 1.8
      const cam = (walk * (LAST + 0.6 + LEAD) - LEAD) * D
      const key = `${cam.toFixed(1)}|${pointer.sx.toFixed(4)}|${pointer.sy.toFixed(4)}`
      if (key === lastKey) return
      lastKey = key

      // The camera dollies forward, with a slow lateral drift, and the room leans to the hand.
      const drift = Math.sin(walk * Math.PI * 3) * (narrow ? 10 : 40)
      if (world.current) world.current.style.transform = `translate3d(${drift}px,0,${cam}px) rotateY(${pointer.sx * 5}deg) rotateX(${-pointer.sy * 3}deg)`

      let look = 0
      // While a look's card is announced, the prints around it step back into the haze.
      let focus = 0
      NODES.forEach((n, i) => {
        if (n.kind !== 'card') return
        const d = SLOTS[i] * D - cam
        focus = Math.max(focus, Math.max(0, 1 - Math.abs(d - 1.1 * D) / (1.1 * D)))
      })
      nodes.current.forEach((el, i) => {
        if (!el) return
        const d = SLOTS[i] * D - cam // distance ahead of the camera
        const n = NODES[i]
        if (n.kind === 'card' && d < D * 0.5) look = n.look
        const center = n.kind === 'card' || (n as Print).full
        // Far prints come out of the haze; centre pieces dissolve as you pass through them.
        let o = d > 6 * D ? 0 : d > 4 * D ? (6 * D - d) / (2 * D) : 1
        if (n.kind !== 'card') o *= 1 - 0.95 * focus
        const pass = center ? 0.9 * D : 0.25 * D
        if (d < pass) o *= Math.max(0, d / pass)
        if (d < 0) o = 0
        el.style.opacity = o.toFixed(3)
        el.style.visibility = o > 0.01 ? 'visible' : 'hidden'
        el.dataset.near = String(d > 0.6 * D && d < 2.2 * D)
        const fog = el.querySelector<HTMLElement>('.sit-fog')
        if (fog) fog.style.opacity = Math.min(0.7, Math.max(0, (d - 1.6 * D) / (4.4 * D))).toFixed(3)
      })

      // A strobe as you step into each look.
      if (look !== lastLook) {
        if (lastLook !== -1 && !reduced && strobe.current) {
          strobe.current.classList.remove('fire')
          void strobe.current.offsetWidth
          strobe.current.classList.add('fire')
        }
        lastLook = look
        sec.dataset.look = String(look)
      }

      // The finale: the three looks fan out like proofs on the table.
      const f = Math.min(1, Math.max(0, (p - WALK) / (1 - WALK) * 1.25))
      sec.style.setProperty('--fin', f.toFixed(4))
      sec.style.setProperty('--intro', Math.max(0, 1 - walk / 0.07).toFixed(4))
      if (finale.current) finale.current.style.visibility = f > 0.001 ? 'visible' : 'hidden'
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('pointermove', onMove)
    }
  }, [])

  const show = useCallback((id: string) => setOpen(PRINTS.findIndex((p) => p.id === id)), [])

  return (
    <section id="chapter-sitting" ref={section} aria-labelledby="sitting-title" className="sitting relative h-[820svh]" data-look="0">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="sit-room" aria-hidden />
        <p className="sit-watermark" aria-hidden>The Sitting</p>
        <div className="sit-stage">
          <div ref={world} className="sit-world">
            {/* Far prints first, so the nearer always paint over them. */}
            {NODES.map((n, i) => [n, i] as const).reverse().map(([n, i]) => {
              const side = n.kind === 'print' && !n.full ? (PRINTS.indexOf(n) % 2 ? 1 : -1) : 0
              const style = {
                ['--x' as string]: n.kind === 'card' ? '0px' : n.full ? `${(NODES.slice(0, i).filter((m) => m.kind === 'card').length % 2 ? 1 : -1) * 21}vw` : `${side * 25}vw`,
                ['--y' as string]: n.kind === 'card' ? '-2vh' : n.full ? '0' : `${((i * 37) % 9) - 4}vh`,
                ['--z' as string]: `calc(${-SLOTS[i]} * var(--D))`,
                ['--r' as string]: `${-side * 14}deg`,
              }
              return (
                <div key={i} ref={(el) => void (nodes.current[i] = el)} className={`sit-node sit-node-${n.kind}${n.kind === 'print' && n.full ? ' sit-full' : ''}`} style={style}>
                  {n.kind === 'card' ? (
                    <div className="sit-card">
                      <p className="sit-numeral">Look {n.numeral}</p>
                      <p className="sit-card-title">{n.title}</p>
                      <p className="sit-card-line">{n.line}</p>
                    </div>
                  ) : (
                    <button type="button" className="sit-print" onClick={() => show(n.id)} aria-label={`Open the photograph: ${n.caption}`}>
                      <span className="sit-mount">
                        {near && <img src={`/media/shoot/${n.id}-900.webp`} alt="" decoding="async" draggable={false} />}
                        <span className="sit-sheen" aria-hidden />
                        <span className="sit-fog" aria-hidden />
                      </span>
                      <span className="sit-caption">{n.caption}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="sit-head pointer-events-none px-[var(--gutter)]">
          <p className="eyebrow">The sitting · Autumn 2026</p>
          <h2 id="sitting-title" className="sit-title">Worn, <em className="accent">and photographed.</em></h2>
        </div>
        <p className="sit-looks px-[var(--gutter)]" aria-hidden>
          {LOOKS.map((l, k) => (
            <span key={l.title} data-k={k}>{l.numeral} · {l.title}</span>
          ))}
        </p>

        <div ref={finale} className="sit-finale">
          <div className="sit-fan">
            {LOOKS.map((l, k) => (
              <button key={l.title} type="button" className="sit-proof" style={{ ['--k' as string]: k - 1 }} onClick={() => show(l.portrait)} aria-label={`Open the ${l.title} look`}>
                <span className="sit-proof-mount">
                  {near && <img src={`/media/shoot/${l.portrait}-900.webp`} alt="" decoding="async" draggable={false} />}
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
  const look = LOOKS[p.id.startsWith('merreeda') ? 0 : Number(p.id.split('-')[1]) >= 14 ? 2 : 1]
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
