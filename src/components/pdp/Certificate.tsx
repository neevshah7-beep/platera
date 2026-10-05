'use client'

import { useRef } from 'react'

/**
 * THE CERTIFICATE. The piece's particulars set out as a certificate from the house: a
 * cream card with a double gold rule and corner ornaments, the hallmark struck as an
 * embossed seal, the specifications with dotted leaders. The card leans a little toward
 * the hand and a sheen crosses it, as card stock does under a lamp.
 */
export function Certificate({ name, sku, purity, huid, specs }: { name: string; sku: string; purity: string; huid?: string | null; specs: [string, string][] }) {
  const card = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !card.current) return
    const r = card.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    card.current.style.setProperty('--rx', `${(0.5 - y) * 5}deg`)
    card.current.style.setProperty('--ry', `${(x - 0.5) * 7}deg`)
    card.current.style.setProperty('--sx', `${x * 100}%`)
  }
  const rest = () => {
    card.current?.style.setProperty('--rx', '0deg')
    card.current?.style.setProperty('--ry', '0deg')
  }
  return (
    <div className="cert-stage" onPointerMove={move} onPointerLeave={rest}>
      <div ref={card} className="cert">
        <span className="cert-corner tl" aria-hidden />
        <span className="cert-corner tr" aria-hidden />
        <span className="cert-corner bl" aria-hidden />
        <span className="cert-corner br" aria-hidden />
        <div className="cert-head">
          <p className="cert-house font-display">PLATERA</p>
          <p className="cert-kind">Certificate of the piece</p>
        </div>
        <p className="cert-name font-display">{name}</p>
        <p className="cert-sku num">No. {sku}</p>
        <div className="cert-body">
          <Seal purity={purity} huid={huid} />
          <dl className="cert-specs">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="cert-sign">
          <span className="font-display">Weighed and checked at the counter</span>
          <span>Gorai 1, Borivali West</span>
        </p>
        <span className="cert-sheen" aria-hidden />
      </div>
    </div>
  )
}

/** The hallmark as an embossed gold seal, its legend running round the rim. */
function Seal({ purity, huid }: { purity: string; huid?: string | null }) {
  return (
    <svg viewBox="0 0 200 200" className="cert-seal" role="img" aria-label={`Hallmarked ${purity}${huid ? `, HUID ${huid}` : ''}`}>
      <defs>
        <radialGradient id="sealg" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fbe7ad" />
          <stop offset="0.45" stopColor="#d6aa52" />
          <stop offset="1" stopColor="#8a6222" />
        </radialGradient>
        <path id="sealrim" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      {/* A scalloped edge, like a foil seal. */}
      <path
        d={Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2
          const r = i % 2 ? 92 : 98
          return `${i ? 'L' : 'M'}${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`
        }).join(' ') + 'Z'}
        fill="url(#sealg)"
      />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#7a5418" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#7a5418" strokeOpacity="0.55" strokeWidth="1.5" />
      <text fontSize="12" letterSpacing="3.2" fill="#5a3d12" fontWeight="600">
        <textPath href="#sealrim">HALLMARKED · STERLING SILVER · PLATERA · GORAI 1 ·</textPath>
      </text>
      <text x="100" y="112" textAnchor="middle" fontSize="40" fill="#4a3210" className="font-display">{purity}</text>
      <text x="100" y="134" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#5a3d12" fontWeight="600">{huid ? `HUID ${huid}` : 'BIS 925'}</text>
    </svg>
  )
}
