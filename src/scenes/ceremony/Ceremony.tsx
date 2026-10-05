'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * THE SEAL. The last step before paying: the total, the ways to pay, and the Platera wax
 * seal. Press and hold it; it stamps, and the secure payment window opens. (The packing
 * and wrapping happen before checkout, in Prepare; the thank-you card and the delivery
 * ride follow the payment, on the order page.)
 */
export function Ceremony({ total, onSealed }: { total: string; onSealed: () => void }) {
  return (
    <div className="ceremony" data-act={3}>
      <ol className="ceremony-steps" aria-label="Your order">
        {['Prepared for you', 'Your details', 'Sealed by you'].map((s, i) => (
          <li key={s} data-on={i === 2} data-done={i < 2}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span> {s}
          </li>
        ))}
      </ol>
      <section className="ceremony-act ceremony-seal-act" aria-live="polite">
        <div className="ceremony-caption ceremony-caption--centre">
          <p className="eyebrow">The last step</p>
          <h2 className="ceremony-title">
            Sealed <em className="accent">by you.</em>
          </h2>
          <p className="ceremony-body">
            <span className="num font-display text-step-3 text-espresso">{total}</span>
            <br />
            Press and hold the seal to open the secure payment window.
          </p>
        </div>
        <WaxSeal onSealed={onSealed} />
        <ul className="pay-ways" aria-label="Ways to pay">
          {[
            ['UPI', 'GPay · PhonePe · Paytm'],
            ['Cards', 'Visa · Mastercard · RuPay'],
            ['Net banking', 'All major banks'],
            ['Wallets', 'And pay later'],
          ].map(([t, s], i) => (
            <li key={t} style={{ animationDelay: `${600 + i * 120}ms` }}>
              <span className="pay-way">{t}</span>
              <span className="pay-sub">{s}</span>
            </li>
          ))}
        </ul>
        <p className="pay-secure">Secured by Razorpay. We never see your card details.</p>
      </section>
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
