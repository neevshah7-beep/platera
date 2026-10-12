'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Phone-only action bar. It appears once the main actions have scrolled out of view
 * below the gallery, never over the photographs, and leaves again when they're back.
 */
export function StickyActions({ slug, name, sold, ask }: { slug: string; name: string; sold: boolean; ask: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const target = document.getElementById('actions')
    if (!target) return
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(target)
    return () => io.disconnect()
  }, [])

  return (
    <div className="sticky-actions" data-show={show} aria-hidden={!show} inert={!show}>
      <p className="sticky-name">{name}</p>
      {sold ? (
        <a href={ask} target="_blank" rel="noopener" className="btn btn-primary">Ask for one like it</a>
      ) : (
        <>
          <a href={ask} target="_blank" rel="noopener" className="btn btn-quiet">Price</a>
          <Link href={`/buy/${slug}`} className="btn btn-primary">Buy</Link>
        </>
      )}
    </div>
  )
}
