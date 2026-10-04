'use client'

import { useActionState } from 'react'
import type { OrderStatus } from '@prisma/client'
import { bookShipment, issueReturnRefund, moveOrder, type OrderActionState } from '../actions'
import { formatINR } from '@/lib/pricing/format'

const BUTTON: Partial<Record<OrderStatus, string>> = {
  PACKED: 'Mark as packed',
  SHIPPED: 'Mark as shipped (tells the customer)',
  DELIVERED: 'Mark as delivered',
  CANCELLED: 'Cancel and refund in full',
  RETURN_REQUESTED: 'Customer asked to return it',
  RETURNED: 'Returned piece received and checked',
}

export function OrderButtons({ orderId, next }: { orderId: string; next: OrderStatus[] }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(moveOrder, null)
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {next.map((to) => (
          <form
            key={to}
            action={action}
            onSubmit={(e) => {
              if (to === 'CANCELLED' && !confirm('Cancel this order and refund the full amount?')) e.preventDefault()
            }}
          >
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="to" value={to} />
            <button className={`btn ${to === 'CANCELLED' ? 'btn-quiet' : 'btn-primary'}`} disabled={pending}>{BUTTON[to] ?? to}</button>
          </form>
        ))}
      </div>
      {state && <p role="status" className={`mt-3 ${state.ok ? '' : 'text-garnet'}`}>{state.message}</p>}
    </div>
  )
}

export function ShipmentForm({ orderId, connected }: { orderId: string; connected: boolean }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(bookShipment, null)
  return (
    <form action={action} className="mt-3 space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      {connected && (
        <>
          <button className="btn btn-primary" disabled={pending}>{pending ? 'Booking…' : 'Book the courier through Shiprocket'}</button>
          <p className="text-step--1 text-ink-light-muted">Or, if you booked it yourself, enter the details:</p>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="courier" className="label">Courier</label><input id="courier" name="courier" className="field" /></div>
        <div><label htmlFor="awb" className="label">Tracking (AWB) number</label><input id="awb" name="awb" className="field num" /></div>
      </div>
      {!connected && <button className="btn btn-primary" disabled={pending}>Save tracking</button>}
      {connected && <button className="btn btn-quiet" disabled={pending}>Save these instead</button>}
      {state && <p role="status" className={state.ok ? '' : 'text-garnet'}>{state.message}</p>}
    </form>
  )
}

export function RefundButton({ orderId, amount }: { orderId: string; amount: number }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(issueReturnRefund, null)
  return (
    <form action={action} className="mt-6" onSubmit={(e) => { if (!confirm(`Refund ${formatINR(amount)} to the customer?`)) e.preventDefault() }}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="confirmAmount" value={amount} />
      <button className="btn btn-primary num" disabled={pending}>Refund {formatINR(amount)}</button>
      {state && <p role="status" className={`mt-3 ${state.ok ? '' : 'text-garnet'}`}>{state.message}</p>}
    </form>
  )
}
