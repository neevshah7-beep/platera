'use client'

import { useEffect } from 'react'
import { STORE, whatsappLink } from '@/lib/store'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="mx-auto max-w-[1440px] px-[var(--gutter)] py-32">
      <p className="num text-step--1 text-ink-muted">Something went wrong{error.digest ? ` · ${error.digest}` : ''}</p>
      <h1 className="mt-3 text-step-6">We couldn’t open that page.</h1>
      <p className="measure mt-6 text-step-1 text-ink-muted">
        Nothing you’ve done has been lost, and no payment has been taken because of this. Try again, or reach us directly.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <a className="btn btn-quiet" href={whatsappLink('Hello Platera, a page on the website didn’t open for me.')}>WhatsApp us</a>
        <a className="btn btn-quiet num" href={`tel:${STORE.phoneE164}`}>{STORE.phoneDisplay}</a>
      </div>
    </div>
  )
}
