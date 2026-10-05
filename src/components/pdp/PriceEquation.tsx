'use client'

import { useEffect, useRef, useState } from 'react'

export type EquationLine = { key: string; label: string; detail: string; paise: number }

const inr = (paise: number) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(paise / 100))

/** A figure that counts up to its value the first time it is seen. */
function Figure({ paise, run, delay }: { paise: number; run: boolean; delay: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const t0 = performance.now() + delay
    const loop = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 1400))
      setV(paise * (1 - Math.pow(1 - k, 4)))
      if (k < 1) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [run, paise, delay])
  return <span className="num">{inr(run ? v : 0)}</span>
}

/**
 * WEIGHED, THEN PRICED. The price set out as one equation in large figures: the metal line
 * with its own working (weight × the day's rate), then every line added up to the price.
 * The figures count up and the gold rules draw in as the section arrives.
 */
export function PriceEquation({ lines, totalPaise, rateNote }: { lines: EquationLine[]; totalPaise: number; rateNote?: string }) {
  const el = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setRun(true), io.disconnect()), { rootMargin: '0px 0px -20% 0px' })
    if (el.current) io.observe(el.current)
    return () => io.disconnect()
  }, [])
  const metal = lines.find((l) => l.key === 'metal')
  return (
    <div ref={el} className="eq" data-run={run}>
      {metal && (
        <p className="eq-working">
          <span className="eq-k">The metal</span>
          <span className="eq-detail font-display">{metal.detail}</span>
          <span className="eq-op" aria-hidden>=</span>
          <span className="eq-v font-display"><Figure paise={metal.paise} run={run} delay={0} /></span>
        </p>
      )}
      <ol className="eq-sum" aria-label="The price, line by line">
        {lines.map((l, i) => (
          <li key={l.key} style={{ ['--i' as string]: i }}>
            {i > 0 && <span className="eq-op" aria-hidden>+</span>}
            <span className="eq-term">
              <span className="eq-v font-display"><Figure paise={l.paise} run={run} delay={200 + i * 160} /></span>
              <span className="eq-k">{l.label}</span>
              <span className="eq-small">{l.detail}</span>
            </span>
          </li>
        ))}
        <li className="eq-total" style={{ ['--i' as string]: lines.length }}>
          <span className="eq-op" aria-hidden>=</span>
          <span className="eq-term">
            <span className="eq-v eq-price font-display"><Figure paise={totalPaise} run={run} delay={300 + lines.length * 160} /></span>
            <span className="eq-k">The price, GST included</span>
          </span>
        </li>
      </ol>
      {rateNote && <p className="eq-note">{rateNote}</p>}
    </div>
  )
}
