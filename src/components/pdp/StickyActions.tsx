'use client'

import { useEffect, useState } from 'react'
import { addToBag } from '@/lib/cart/actions'

/**
 * Phone-only action bar. It appears once the main actions have scrolled out of view
 * below the gallery, never over the photographs, and leaves again when they're back.
 */
export function StickyActions({
  productId,
  name,
  price,
  enquiry,
}: {
  productId: string
  name: string
  price: string | null
  enquiry: string
}) {
  const [show, setShow] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const target = document.getElementById('actions')
    if (!target) return
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    })
    io.observe(target)
    return () => io.disconnect()
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-ground/95 px-[var(--gutter)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-transform duration-[var(--dur-calm)] ease-[var(--ease-settle)] lg:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-step--1 text-ink-muted">{name}</p>
          {price && <p className="num font-display text-step-1">{price}</p>}
        </div>
        {price ? (
          <form
            action={async (fd) => {
              const r = await addToBag(null, fd)
              setAdded(Boolean(r?.ok))
            }}
          >
            <input type="hidden" name="productId" value={productId} />
            <button className="btn btn-primary" type="submit">{added ? 'In your bag' : 'Add to bag'}</button>
          </form>
        ) : (
          <a href={enquiry} className="btn btn-primary">Enquire</a>
        )}
      </div>
    </div>
  )
}
