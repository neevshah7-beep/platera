'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { addToBag, buyNow, type BagActionState } from '@/lib/cart/actions'

function Submit({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {children}
    </button>
  )
}

export function BagButtons({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [state, action] = useActionState<BagActionState, FormData>(addToBag, null)
  return (
    <div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
        <form action={action}>
          <input type="hidden" name="productId" value={productId} />
          <Submit className="btn btn-primary w-full">Add to bag</Submit>
        </form>
        <form action={buyNow}>
          <input type="hidden" name="productId" value={productId} />
          <Submit className="btn btn-quiet w-full">Buy now</Submit>
        </form>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-[1.5em] text-step--1 text-ink-muted">
        {state?.message}
        {state?.ok && (
          <>
            {' '}
            <Link href="/bag" className="link text-ink">View bag</Link>
          </>
        )}
      </p>
    </div>
  )
}
