'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const WORD = 'PLATERA'

/**
 * The hero type, set over the fall. After the ring lands, PLATERA rises letter by letter
 * from the centre outward (each letter in its own mask), cast in polished gold whose
 * highlight follows the pointer; then the line and the two actions arrive. The H1 is real
 * text (the page's LCP element) and is present from the first paint for crawlers.
 */
export function HeroCopy({ landed, line, collaboration }: { landed: boolean; line: string; collaboration: string }) {
  const word = useRef<HTMLDivElement>(null)
  const [sheen, setSheen] = useState(50)
  useEffect(() => {
    const onMove = (e: PointerEvent) => setSheen(20 + (e.clientX / innerWidth) * 60)
    addEventListener('pointermove', onMove, { passive: true })
    return () => removeEventListener('pointermove', onMove)
  }, [])
  const mid = (WORD.length - 1) / 2

  return (
    <div data-landed={landed} className="hero-copy pointer-events-none absolute inset-0 flex flex-col justify-between px-[var(--gutter)] pb-[7svh] pt-[10svh]">
      <div ref={word} aria-hidden className="flex justify-center" style={{ ['--sheen-pos' as string]: `${sheen}%` }}>
        {WORD.split('').map((ch, i) => (
          <span key={i} className="hero-letter-mask">
            <span className="hero-letter metal-text font-display" style={{ transitionDelay: `${180 + Math.abs(i - mid) * 90}ms` }}>
              {ch}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="hero-rise eyebrow" style={{ transitionDelay: '700ms' }}>{collaboration}</p>
          <h1 className="hero-rise mt-4 text-[clamp(1.9rem,1.2rem+2.4vw,3.4rem)] leading-[1.02]" style={{ transitionDelay: '820ms' }}>
            {line}
          </h1>
        </div>
        <div className="hero-rise pointer-events-auto flex flex-wrap gap-3" style={{ transitionDelay: '980ms' }}>
          <Link href="/collection" className="btn btn-primary">Enter the collection</Link>
          <Link href="/appointment" className="btn btn-quiet">Book a viewing</Link>
        </div>
      </div>
    </div>
  )
}
