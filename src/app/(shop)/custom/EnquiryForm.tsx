'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { sendEnquiry, type FormState } from '@/lib/appointments-actions'

function Submit() {
  const { pending } = useFormStatus()
  return <button className="btn btn-quiet" disabled={pending}>{pending ? 'Sending…' : 'Send'}</button>
}

export function EnquiryForm({ kind, productSlug }: { kind: 'PIECE' | 'CUSTOM_ORDER' | 'GENERAL'; productSlug?: string }) {
  const [state, action] = useActionState<FormState, FormData>(sendEnquiry, null)
  const e = state?.errors ?? {}
  const v = state?.values

  if (state?.ok) return <p role="status" className="text-ink">Thank you. We’ll reply on WhatsApp or by phone during store hours.</p>

  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2" noValidate>
      <input type="hidden" name="kind" value={kind} />
      {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
      {[
        ['name', 'Your name', 'text', 'name'],
        ['phone', 'Mobile', 'tel', 'tel-national'],
      ].map(([name, label, type, ac]) => (
        <div key={name}>
          <label htmlFor={`e-${name}`} className="label">{label}</label>
          <input id={`e-${name}`} name={name} type={type} autoComplete={ac} defaultValue={v?.[name]} className="field" aria-invalid={Boolean(e[name])} />
          {e[name] && <p className="mt-1 text-step--1 text-ruby-bright">{e[name]}</p>}
        </div>
      ))}
      <div className="sm:col-span-2">
        <label htmlFor="e-message" className="label">What would you like made? Size, length, occasion, budget</label>
        <textarea id="e-message" name="message" rows={4} defaultValue={v?.message} className="field resize-none" aria-invalid={Boolean(e.message)} />
        {e.message && <p className="mt-1 text-step--1 text-ruby-bright">{e.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <Submit />
        <p role="status" aria-live="polite" className="mt-2 text-step--1 text-ruby-bright">{state && !state.ok ? state.message : ''}</p>
      </div>
    </form>
  )
}
