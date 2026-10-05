'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void }
  }
}

type Props = {
  mode: 'razorpay' | 'simulate' | 'unavailable'
  keyId: string
  razorpayOrderId: string | null
  amountPaise: number
  orderNumber: string
  token: string
  prefill: { name: string; email: string; contact: string }
  /** When set, nothing opens on its own; each increment opens the payment (the wax seal). */
  openSignal?: number
}

export function PayLauncher(p: Props) {
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const verify = useCallback(
    async (body: Record<string, string>, endpoint = '/api/checkout/verify') => {
      setBusy(true)
      setStatus('Confirming your payment…')
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: p.orderNumber, token: p.token, ...body }),
      })
      const data = (await res.json()) as { redirect?: string; message?: string }
      if (data.redirect) window.location.assign(data.redirect)
      else {
        setBusy(false)
        setStatus(data.message ?? 'We couldn’t confirm the payment. If money has left your account, it will be refunded; call us and we’ll check.')
      }
    },
    [p.orderNumber, p.token],
  )

  const open = useCallback(() => {
    if (!window.Razorpay || !p.razorpayOrderId) return
    const rzp = new window.Razorpay({
      key: p.keyId,
      order_id: p.razorpayOrderId,
      amount: p.amountPaise,
      currency: 'INR',
      name: 'Platera Jewellers',
      description: `Order ${p.orderNumber}`,
      prefill: p.prefill,
      theme: { color: '#1c1b19' },
      handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void verify(r),
      modal: { ondismiss: () => setStatus('Payment window closed. Nothing has been charged. You can open it again.') },
    })
    rzp.on('payment.failed', () => setStatus('The payment didn’t go through. Nothing has been charged. Try again, or use another method.'))
    rzp.open()
  }, [p, verify])

  // The seal: each new signal opens the window (or, in development, simulates the payment).
  const lastSignal = useRef(0)
  useEffect(() => {
    if (!p.openSignal || p.openSignal === lastSignal.current) return
    lastSignal.current = p.openSignal
    if (p.mode === 'simulate') void verify({ simulate: 'success' }, '/api/checkout/simulate')
    else if (p.mode === 'razorpay' && ready) open()
  }, [p.openSignal, p.mode, ready, open, verify])

  if (p.mode === 'unavailable') {
    return <p className="mt-10 text-ruby-bright">Online payment isn’t switched on yet. Please call or WhatsApp us to complete this order.</p>
  }

  if (p.mode === 'simulate') {
    return (
      <div className="mt-10 border border-rule p-6">
        <p className="text-step--1 text-ink-muted">Development mode: Razorpay keys aren’t set, so the payment can be simulated.</p>
        <button className="btn btn-primary mt-4" disabled={busy} onClick={() => verify({ simulate: 'success' }, '/api/checkout/simulate')}>
          Simulate a successful payment
        </button>
        <p role="status" aria-live="polite" className="mt-3 text-step--1">{status}</p>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => { setReady(true); if (p.openSignal === undefined || p.openSignal > 0) open() }} />
      <button className="btn btn-primary mt-10" onClick={open} disabled={!ready || busy}>
        {ready ? 'Open the payment window' : 'Loading secure payment…'}
      </button>
      <p role="status" aria-live="polite" className="mt-4 text-step--1 text-ink-muted">{status}</p>
    </>
  )
}
