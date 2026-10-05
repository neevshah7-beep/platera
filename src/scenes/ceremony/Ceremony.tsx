'use client'

import { useEffect, useRef, useState } from 'react'
import { createPacking, type PackPiece } from './packing'

/**
 * THE CHECKOUT CEREMONY. Between "Buy now" and the payment window, three short acts:
 *   I    Prepared for you: the piece is laid into its Platera case, the lid closes, a gold
 *        band seals it (packing.ts, WebGL).
 *   II   On its way: a gold route draws from Gorai 1 to the delivery city; the parcel
 *        travels it, past each milestone, and the expected delivery date is set.
 *   III  Sealed by you: press and hold the wax seal; it stamps, and the payment opens.
 * Every act can be skipped; reduced-motion visitors go straight to the seal.
 */
type Act = 1 | 2 | 3
export function Ceremony({
  pieces,
  names,
  city,
  pincode,
  eta,
  total,
  onSealed,
}: {
  pieces: PackPiece[]
  names: string[]
  city: string
  pincode: string
  eta: string
  total: string
  onSealed: () => void
}) {
  const [act, setAct] = useState<Act>(1)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setAct(3)
  }, [])

  useEffect(() => {
    if (act !== 1) return
    const c = canvas.current!
    let api: ReturnType<typeof createPacking> | null = null
    try {
      api = createPacking(c, pieces, () => setTimeout(() => setAct(2), 600))
    } catch {
      setAct(2)
      return
    }
    const ro = new ResizeObserver(() => api?.resize())
    ro.observe(c)
    return () => {
      ro.disconnect()
      api?.dispose()
    }
  }, [act, pieces])

  useEffect(() => {
    if (act !== 2) return
    const t = setTimeout(() => setAct(3), 6200)
    return () => clearTimeout(t)
  }, [act])

  return (
    <div className="ceremony" data-act={act}>
      <ol className="ceremony-steps" aria-label="Your order">
        {['Prepared for you', 'On its way', 'Sealed by you'].map((s, i) => (
          <li key={s} data-on={act === i + 1} data-done={act > i + 1}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span> {s}
          </li>
        ))}
      </ol>

      {act === 1 && (
        <section className="ceremony-act" aria-live="polite">
          <canvas ref={canvas} aria-hidden className="ceremony-canvas" />
          <div className="ceremony-caption">
            <p className="eyebrow">Act one</p>
            <h2 className="ceremony-title">
              Prepared <em className="accent">for you.</em>
            </h2>
            <p className="ceremony-body">{names.join(' · ')}, laid in its Platera case and sealed with gold.</p>
          </div>
          <button type="button" className="ceremony-skip" onClick={() => setAct(2)}>Skip</button>
        </section>
      )}

      {act === 2 && (
        <section className="ceremony-act" aria-live="polite">
          <Journey city={city} pincode={pincode} eta={eta} />
          <button type="button" className="ceremony-skip" onClick={() => setAct(3)}>Skip</button>
        </section>
      )}

      {act === 3 && (
        <section className="ceremony-act ceremony-seal-act" aria-live="polite">
          <div className="ceremony-caption ceremony-caption--centre">
            <p className="eyebrow">Act three</p>
            <h2 className="ceremony-title">
              Sealed <em className="accent">by you.</em>
            </h2>
            <p className="ceremony-body">
              <span className="num font-display text-step-3 text-espresso">{total}</span>
              <br />
              Press and hold the seal to open the secure payment window. UPI, card or net banking; we never see your card details.
            </p>
          </div>
          <WaxSeal onSealed={onSealed} />
        </section>
      )}
    </div>
  )
}

/** Act II: the route from the counter to the visitor's door. */
function Journey({ city, pincode, eta }: { city: string; pincode: string; eta: string }) {
  // A gentle S-curve across the page; the parcel and milestones ride it.
  const d = 'M 80 330 C 300 330, 330 120, 560 150 S 860 360, 1080 170'
  const path = useRef<SVGPathElement>(null)
  const parcel = useRef<SVGGElement>(null)
  const [len, setLen] = useState(1600)
  const stops = [
    { at: 0, label: 'Gorai 1, Mumbai', sub: 'Hallmarked & weighed' },
    { at: 0.36, label: 'Wrapped by hand', sub: 'Box, paper, satin' },
    { at: 0.66, label: 'Insured courier', sub: 'Sealed & tracked' },
    { at: 1, label: city, sub: `PIN ${pincode}` },
  ]
  const [pts, setPts] = useState<{ x: number; y: number }[]>([])

  useEffect(() => {
    const p = path.current!
    const L = p.getTotalLength()
    setLen(L)
    setPts(stops.map((s) => p.getPointAtLength(L * s.at)))
    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const k = Math.min(1, Math.max(0, (now - t0 - 900) / 4200))
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      const q = p.getPointAtLength(L * e)
      const q2 = p.getPointAtLength(Math.min(L, L * e + 2))
      const ang = (Math.atan2(q2.y - q.y, q2.x - q.x) * 180) / Math.PI
      parcel.current?.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${ang * 0.25})`)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="journey">
      <div className="ceremony-caption">
        <p className="eyebrow">Act two</p>
        <h2 className="ceremony-title">
          On its way <em className="accent">to {city}.</em>
        </h2>
        <p className="ceremony-body">
          Expected <span className="font-display text-espresso">{eta}</span>, sent insured from Gorai 1.
        </p>
      </div>
      <svg viewBox="0 0 1160 460" className="journey-svg" aria-hidden>
        <defs>
          <linearGradient id="jg" x1="0" x2="1">
            <stop offset="0" stopColor="#7a5418" />
            <stop offset="0.5" stopColor="#f1d488" />
            <stop offset="1" stopColor="#c99a3e" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="rgb(43 29 14 / 0.12)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
        <path ref={path} d={d} fill="none" stroke="url(#jg)" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: len, strokeDashoffset: len, animation: 'journey-draw 4.2s cubic-bezier(.65,0,.35,1) 0.9s forwards' }} />
        {pts.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`} className="journey-stop" style={{ animationDelay: `${0.9 + stops[i].at * 4.2}s` }}>
            <circle r="7" fill="#f6ecd6" stroke="#c99a3e" strokeWidth="2" />
            <circle r="2.6" fill="#7a5418" />
            <text y={i % 2 ? 34 : -22} textAnchor="middle" className="journey-label">{stops[i].label}</text>
            <text y={i % 2 ? 54 : -42} textAnchor="middle" className="journey-sub">{stops[i].sub}</text>
          </g>
        ))}
        {/* The parcel: a little Platera box in espresso paper with a gold band. */}
        <g ref={parcel} transform="translate(80 330)">
          <g transform="translate(-16 -30)">
            <rect width="32" height="24" rx="2" fill="#2b1d0e" />
            <rect x="13" width="6" height="24" fill="#c99a3e" />
            <rect y="9" width="32" height="5" fill="#c99a3e" />
            <path d="M16 0 C 8 -9, 4 -2, 16 0 C 28 -2, 24 -9, 16 0" fill="#e2b25b" />
          </g>
        </g>
      </svg>
    </div>
  )
}

/** Act III: press and hold the wax seal; when full it stamps and calls onSealed. */
function WaxSeal({ onSealed }: { onSealed: () => void }) {
  const [charge, setCharge] = useState(0)
  const [stamped, setStamped] = useState(false)
  const holding = useRef(false)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = (now - last) / 1000
      last = now
      if (stamped) return
      setCharge((c) => {
        const n = holding.current ? Math.min(1, c + dt / 1.1) : Math.max(0, c - dt / 0.6)
        if (n >= 1 && !stamped) {
          setStamped(true)
          navigator.vibrate?.(30)
          setTimeout(onSealed, 700)
        }
        return n
      })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stamped, onSealed])
  const down = () => (holding.current = true)
  const up = () => (holding.current = false)
  return (
    <button
      type="button"
      className="wax-seal"
      data-stamped={stamped}
      style={{ ['--charge' as string]: `${charge * 100}%` }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && down()}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && up()}
      aria-label="Press and hold to seal and pay"
    >
      <span className="wax-ring" aria-hidden />
      <span className="wax-disc" aria-hidden>
        <span className="wax-p font-display">P</span>
      </span>
      <span className="wax-label">{stamped ? 'Sealed' : 'Press and hold to seal & pay'}</span>
    </button>
  )
}
