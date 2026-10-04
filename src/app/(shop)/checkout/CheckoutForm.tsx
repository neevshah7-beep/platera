'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { MetalRule } from '@/components/metal/LightSource'
import { placeOrder, type CheckoutState } from '@/lib/orders/actions'
import { formatINR } from '@/lib/pricing/format'
import { INDIAN_STATES } from '@/lib/validation'

type Summary = { lines: { id: string; name: string; totalPaise: number }[]; shippingPaise: number; totalPaise: number }

function Field({
  name,
  label,
  error,
  values,
  className = '',
  ...rest
}: { name: string; label: string; error?: string; values?: Record<string, string>; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={name} defaultValue={values?.[name]} className="field" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      {error && <p id={`${id}-err`} className="mt-1 text-step--1 text-ruby-bright">{error}</p>}
    </div>
  )
}

function PayButton({ total }: { total: number }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary num w-full" disabled={pending} aria-disabled={pending}>
      {pending ? 'Preparing secure payment…' : `Pay ${formatINR(total)}`}
    </button>
  )
}

export function CheckoutForm({ summary, conditions }: { summary: Summary; conditions: string[] }) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, null)
  const e = state?.errors ?? {}
  const v = state?.values

  return (
    <form action={action} className="mt-10 grid gap-16 lg:grid-cols-12" noValidate>
      <div className="space-y-14 lg:col-span-7">
        <fieldset>
          <legend className="font-display text-step-3">Where should we send it?</legend>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field name="name" values={v} label="Full name" autoComplete="name" required error={e['address.name']} className="sm:col-span-2" />
            <Field name="phone" values={v} label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" required error={e['address.phone']} />
            <Field name="email" values={v} label="Email, for your receipt" type="email" autoComplete="email" required error={e.email} />
            <Field name="line1" values={v} label="House, building, street" autoComplete="address-line1" required error={e['address.line1']} className="sm:col-span-2" />
            <Field name="line2" values={v} label="Area and landmark (optional)" autoComplete="address-line2" error={e['address.line2']} className="sm:col-span-2" />
            <Field name="city" values={v} label="City" autoComplete="address-level2" required error={e['address.city']} />
            <Field name="pincode" values={v} label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} required error={e['address.pincode']} />
            <div className="sm:col-span-2">
              <label htmlFor="f-state" className="label">State</label>
              <select id="f-state" name="state" className="field" key={v?.state} defaultValue={v?.state ?? 'Maharashtra'} aria-invalid={Boolean(e['address.state'])}>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} className="bg-velvet">{s}</option>
                ))}
              </select>
              {e['address.state'] && <p className="mt-1 text-step--1 text-ruby-bright">{e['address.state']}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-step-3">Is it a gift?</legend>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="f-gift" className="label">A message for the card (optional)</label>
              <textarea id="f-gift" name="giftMessage" rows={3} maxLength={240} defaultValue={v?.giftMessage} className="field resize-none" />
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="hidePrices" defaultChecked={v?.hidePrices === 'on'} className="mt-1.5 size-4 accent-[var(--argent)]" />
              <span>Leave the prices off the paperwork in the parcel.</span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-step-3">Before you pay</legend>
          <ul className="measure mt-6 space-y-3 text-ink-muted">
            {conditions.map((c) => (
              <li key={c} className="border-l border-rule pl-4">{c}</li>
            ))}
          </ul>
          <label className="mt-6 flex items-start gap-3">
            <input type="checkbox" name="acceptPolicy" required defaultChecked={v?.acceptPolicy === 'on'} className="mt-1.5 size-4 accent-[var(--argent)]" aria-invalid={Boolean(e.acceptPolicy)} />
            <span>I’ve read these conditions and the <a href="/policies/returns" target="_blank" className="link">returns policy</a>.</span>
          </label>
          {e.acceptPolicy && <p className="mt-1 text-step--1 text-ruby-bright">{e.acceptPolicy}</p>}
        </fieldset>
      </div>

      <aside aria-label="Order summary" className="lg:col-span-4 lg:col-start-9">
        <div className="lg:sticky lg:top-24">
          <h2 className="font-display text-step-3">Your order</h2>
          <ul className="num mt-6">
            {summary.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4 border-t border-rule py-3">
                <span>{l.name}</span>
                <span>{formatINR(l.totalPaise)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 border-t border-rule py-3 text-ink-muted">
              <span>Delivery across India</span>
              <span>{summary.shippingPaise ? formatINR(summary.shippingPaise) : 'Free'}</span>
            </li>
          </ul>
          <MetalRule />
          <p className="num mt-4 flex justify-between font-display text-step-2"><span>To pay</span><span>{formatINR(summary.totalPaise)}</span></p>
          <p className="mt-1 text-step--1 text-ink-muted">GST included. When you continue, this price is held for your payment.</p>
          <div className="mt-8"><PayButton total={summary.totalPaise} /></div>
          <p role="status" aria-live="polite" className="mt-3 text-step--1 text-ruby-bright">{state?.message}</p>
          <p className="mt-4 text-step--1 text-ink-muted">You’ll pay on Razorpay’s secure page by UPI, card or net banking. Cash on delivery isn’t offered.</p>
        </div>
      </aside>
    </form>
  )
}
