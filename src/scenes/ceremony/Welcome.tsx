'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * AFTER PAYMENT. Two moments before the order page:
 *   I  The card. An espresso envelope with the Platera wax seal; the seal lifts, the flap
 *      opens, and a letterpress card rises out of it: thank you, by name, from the house.
 *   II The ride. A Platera rider on a scooter, the wrapped box on the rack, rides out of
 *      Gorai 1 through the city (the Sea Link, the lamps, the palms) while a gold line
 *      marks the way; the ride slows and stops at a door, with the expected delivery date.
 * Drawn in the house's monoline: espresso ink, gold accents, champagne ground.
 */
type Part = 'card' | 'ride' | 'done'
export function Welcome({ firstName, pieces, city, eta, orderNumber }: { firstName: string; pieces: string[]; city: string; eta: string; orderNumber: string }) {
  const [part, setPart] = useState<Part>('card')
  const [leaving, setLeaving] = useState(false)
  const router = useRouter()
  const finish = useCallback(() => {
    setLeaving(true)
    setTimeout(() => setPart('done'), 700)
    // A refresh shows the order, not the ceremony again.
    router.replace(location.pathname + location.search.replace(/&?welcome=1/, ''), { scroll: false })
  }, [router])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPart('done')
  }, [])

  if (part === 'done') return null
  return (
    <div className="welcome" data-leaving={leaving}>
      {part === 'card' ? (
        <ThankYouCard firstName={firstName} pieces={pieces} orderNumber={orderNumber} onNext={() => setPart('ride')} />
      ) : (
        <Ride city={city} eta={eta} onDone={finish} />
      )}
    </div>
  )
}

function ThankYouCard({ firstName, pieces, orderNumber, onNext }: { firstName: string; pieces: string[]; orderNumber: string; onNext: () => void }) {
  const [step, setStep] = useState(0) // 0 sealed · 1 seal lifts · 2 flap opens · 3 card rises · 4 card forward
  useEffect(() => {
    const ts = [700, 1300, 2000, 3000].map((ms, i) => setTimeout(() => setStep(i + 1), ms))
    return () => ts.forEach(clearTimeout)
  }, [])
  const list = pieces.length > 1 ? `${pieces.slice(0, -1).join(', ')} and ${pieces[pieces.length - 1]}` : pieces[0]
  return (
    <section className="ty" data-step={step} aria-live="polite">
      <div className="ty-stage">
        <div className="ty-envelope" aria-hidden>
          <span className="ty-back" />
          <div className="ty-card">
            <span className="ty-mono font-display">P</span>
            <p className="ty-thanks font-display">Thank you, <em className="accent">{firstName}.</em></p>
            <p className="ty-note">
              Your {list} {pieces.length > 1 ? 'are' : 'is'} being readied at our Gorai 1 counter: weighed, hallmarked, wrapped by hand, and sent insured.
            </p>
            <p className="ty-sign font-display">With love,<br />Platera Jewellers</p>
            <p className="ty-order num">Order {orderNumber}</p>
          </div>
          <span className="ty-front" />
          <span className="ty-flap" />
          <span className="ty-seal font-display">P</span>
        </div>
      </div>
      <div className="ty-actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>See it on its way</button>
      </div>
    </section>
  )
}

const RIDE_S = 7.2 // the ride, seconds; it slows over the last 2 s and stops at the door
function Ride({ city, eta, onDone }: { city: string; eta: string; onDone: () => void }) {
  const far = useRef<HTMLDivElement>(null)
  const mid = useRef<HTMLDivElement>(null)
  const near = useRef<HTMLDivElement>(null)
  const door = useRef<HTMLDivElement>(null)
  const rider = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    // Distance travelled (in seconds of cruise): full speed, then an ease to rest over 2 s.
    const cruise = RIDE_S - 2
    const total = cruise + 2 / 3
    const dist = (t: number) => {
      if (t <= cruise) return t
      const u = Math.min(1, (t - cruise) / 2)
      return cruise + 2 * (u - u * u + (u * u * u) / 3)
    }
    const NEAR = 420 // px per second of cruise on the road
    let raf = 0
    const t0 = performance.now()
    let done = false
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const t = Math.min(RIDE_S, (now - t0) / 1000)
      const d = dist(t)
      const w = innerWidth
      // The drawing is scaled up on wide screens; the road moves in the same scale.
      const S = w >= 1024 ? 1.45 : 1
      far.current?.style.setProperty('transform', `translate3d(${-((d * NEAR * S * 0.18) % (1600 * S))}px,0,0)`)
      mid.current?.style.setProperty('transform', `translate3d(${-((d * NEAR * S * 0.55) % (1200 * S))}px,0,0)`)
      near.current?.style.setProperty('transform', `translate3d(${-((d * NEAR * S) % 240)}px,0,0)`)
      // The door arrives with the road and stops beside the rider.
      const doorX = w * 0.6 + (total - d) * NEAR * S
      door.current?.style.setProperty('transform', `translate3d(${doorX}px,0,0)`)
      const k = d / total
      if (line.current) line.current.style.transform = `scaleX(${k})`
      if (dot.current) dot.current.style.left = `${k * 100}%`
      // The wheels turn with the road (radius 26 in the drawing).
      const turn = ((d * NEAR) / 26) * (180 / Math.PI) * 0.55
      rider.current?.querySelectorAll<SVGGElement>('.ride-spin').forEach((g) => g.setAttribute('transform', `rotate(${turn % 360})`))
      if (t >= RIDE_S && !done) {
        done = true
        setArrived(true)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const stops = ['Gorai 1', 'Borivali', 'On the highway', city]
  return (
    <section className="ride" data-arrived={arrived} aria-live="polite">
      <div className="ride-head">
        <p className="eyebrow">On its way</p>
        <h2 className="ride-title">{arrived ? <>At your door, <em className="accent">{eta}.</em></> : <>Riding out <em className="accent">to {city}.</em></>}</h2>
        <div className="ride-route" aria-hidden>
          <span className="ride-route-line" ref={line} />
          <span className="ride-route-dot" ref={dot} />
          {stops.map((s, i) => (
            <span key={s} className="ride-stop" data-mid={i > 0 && i < stops.length - 1} data-last={i === stops.length - 1} style={{ left: `${(i / (stops.length - 1)) * 100}%`, transform: i === 0 ? 'none' : i === stops.length - 1 ? 'translateX(-100%)' : undefined }}>{s}</span>
          ))}
        </div>
      </div>

      <div className="ride-scene" aria-hidden>
        <div className="ride-sun" />
        <div className="ride-layer ride-far" ref={far}><Skyline /><Skyline /></div>
        <div className="ride-layer ride-mid" ref={mid}><Street /><Street /></div>
        <div className="ride-door" ref={door}><Door /></div>
        <div className="ride-rider" ref={rider}><Scooter /></div>
        <div className="ride-road">
          <div className="ride-layer ride-near" ref={near}><Dashes /></div>
        </div>
      </div>

      <div className="ride-foot">
        <p className="ride-eta">Expected <span className="font-display">{eta}</span> · insured, tracked, signed for</p>
        <button type="button" className="btn btn-primary" onClick={onDone}>{arrived ? 'See your order' : 'Skip to your order'}</button>
      </div>
    </section>
  )
}

const INK = '#2b1d0e'
const GOLD = '#c99a3e'

/** The far city: towers, and the cable-stayed Sea Link. One 1600 px tile, drawn twice. */
function Skyline() {
  const towers = [[40, 120], [90, 170], [150, 110], [200, 200], [250, 140], [330, 90], [900, 150], [950, 210], [1010, 130], [1070, 180], [1140, 120], [1400, 160], [1450, 110], [1500, 190]]
  return (
    <svg viewBox="0 0 1600 260" width="1600" height="260" className="ride-svg">
      {towers.map(([x, h], i) => (
        <rect key={i} x={x} y={260 - h} width={44} height={h} fill="#d9bc86" opacity={0.55 + (i % 3) * 0.12} />
      ))}
      {/* The Sea Link: two pylons, fans of cable, a long deck. */}
      <path d="M 430 230 L 840 230" stroke="#c4a064" strokeWidth="4" />
      {[540, 730].map((x) => (
        <g key={x} stroke="#c4a064" strokeWidth="1.4" fill="none">
          <path d={`M ${x - 10} 230 L ${x} 70 L ${x + 10} 230`} strokeWidth="3" />
          {[-90, -70, -50, -30, 30, 50, 70, 90].map((dx) => (
            <path key={dx} d={`M ${x} ${80 + Math.abs(dx) * 0.2} L ${x + dx} 230`} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** The street: lamps with gold glow, and palms. One 1200 px tile. */
function Street() {
  return (
    <svg viewBox="0 0 1200 300" width="1200" height="300" className="ride-svg">
      {[100, 500, 900].map((x) => (
        <g key={x} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round">
          <path d={`M ${x} 300 L ${x} 110 C ${x} 92, ${x + 8} 86, ${x + 26} 86`} />
          <path d={`M ${x + 18} 86 L ${x + 34} 86 L ${x + 30} 96 L ${x + 22} 96 Z`} fill={GOLD} stroke={INK} strokeWidth="1.6" />
          <circle cx={x + 26} cy={104} r="16" fill="rgb(241 212 136 / 0.35)" stroke="none" />
        </g>
      ))}
      {[300, 700, 1080].map((x, i) => (
        <g key={x} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round">
          <path d={`M ${x} 300 C ${x + 4} 240, ${x + 2 - i * 3} 180, ${x + 10} 130`} />
          <path d={`M ${x + 10} 130 C ${x - 20} 118, ${x - 44} 126, ${x - 58} 144`} />
          <path d={`M ${x + 10} 130 C ${x + 38} 116, ${x + 62} 124, ${x + 74} 142`} />
          <path d={`M ${x + 10} 130 C ${x - 6} 106, ${x - 24} 100, ${x - 40} 104`} />
          <path d={`M ${x + 10} 130 C ${x + 24} 104, ${x + 44} 98, ${x + 60} 104`} />
          <path d={`M ${x + 10} 130 C ${x + 8} 112, ${x + 14} 98, ${x + 22} 90`} />
        </g>
      ))}
    </svg>
  )
}

function Dashes() {
  return (
    <svg viewBox="0 0 2400 20" width="2400" height="20" className="ride-svg">
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 240} y="8" width="120" height="4" rx="2" fill={GOLD} opacity="0.75" />
      ))}
    </svg>
  )
}

/** The door at the end of the ride: an arched entrance with a lamp and a step. */
function Door() {
  return (
    <svg viewBox="0 0 260 340" width="260" height="340" className="ride-svg">
      <rect x="10" y="20" width="240" height="320" fill="#f3e3c2" stroke={INK} strokeWidth="2.2" />
      <path d="M 70 340 L 70 150 C 70 95, 190 95, 190 150 L 190 340" fill="#e2c48b" stroke={INK} strokeWidth="2.2" />
      <path d="M 130 112 L 130 340" stroke={INK} strokeWidth="1.6" />
      <circle cx="118" cy="240" r="4" fill={GOLD} stroke={INK} strokeWidth="1.4" />
      <circle cx="142" cy="240" r="4" fill={GOLD} stroke={INK} strokeWidth="1.4" />
      <path d="M 210 120 L 228 120 L 224 140 L 214 140 Z" fill={GOLD} stroke={INK} strokeWidth="1.6" />
      <circle cx="219" cy="146" r="18" fill="rgb(241 212 136 / 0.4)" />
      <rect x="50" y="330" width="160" height="10" fill="#d9bc86" stroke={INK} strokeWidth="1.6" />
    </svg>
  )
}

/** The Platera rider: a scooter in monoline, the wrapped box on the rack. */
function Scooter() {
  return (
    <svg viewBox="0 0 280 200" width="280" height="200" className="ride-svg ride-scooter">
      <g className="ride-bob">
        {/* The box: espresso paper, a gold band and bow. */}
        <g transform="translate(26 58)">
          <rect width="46" height="34" rx="2" fill={INK} />
          <rect x="20" width="7" height="34" fill={GOLD} />
          <rect y="13" width="46" height="6" fill={GOLD} />
          <path d="M 23 0 C 12 -12, 6 -3, 23 0 C 35 -3, 32 -12, 23 0" fill="#e2b25b" stroke={INK} strokeWidth="1" />
        </g>
        <path d="M 22 92 L 84 92" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        {/* Body: the rear cowl, floorboard, leg shield, column and bars. */}
        <path d="M 30 150 C 26 116, 58 100, 104 104 C 120 106, 128 120, 126 140 L 126 146 Z" fill="#f6ecd6" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M 126 146 L 176 146" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d="M 176 146 C 184 120, 186 96, 196 70" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 196 70 L 206 44" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 194 44 L 220 42" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="214" cy="58" r="6" fill={GOLD} stroke={INK} strokeWidth="1.8" />
        <path d="M 190 148 C 196 128, 226 128, 234 148" fill="none" stroke={INK} strokeWidth="2.4" />
        <path d="M 70 100 C 80 92, 112 92, 122 100" stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* The rider. */}
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 104 96 L 124 52" />
          <path d="M 122 58 C 146 58, 176 50, 204 46" />
          <path d="M 106 96 L 152 98 L 166 142" />
          <path d="M 162 142 L 178 142" />
        </g>
        <circle cx="128" cy="36" r="12" fill="#f6ecd6" stroke={INK} strokeWidth="2.4" />
        <path d="M 115 36 C 115 18, 141 18, 141 36 Z" fill={GOLD} stroke={INK} strokeWidth="2" />
      </g>
      <Wheel cx={62} />
      <Wheel cx={212} />
    </svg>
  )
}

function Wheel({ cx }: { cx: number }) {
  return (
    <g transform={`translate(${cx} 160)`}>
      <circle r="26" fill="#f6ecd6" stroke={INK} strokeWidth="3" />
      <g className="ride-spin">
        <circle r="10" fill="none" stroke={GOLD} strokeWidth="2" />
        {[0, 60, 120].map((a) => (
          <path key={a} d="M -22 0 L 22 0" transform={`rotate(${a})`} stroke={INK} strokeWidth="1.2" />
        ))}
      </g>
      <circle r="3" fill={INK} />
    </g>
  )
}
