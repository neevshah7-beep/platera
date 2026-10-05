'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { requestAppointment, type FormState } from '@/lib/appointments-actions'
import { track } from '@/lib/analytics/client'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="btn btn-primary w-full sm:w-auto" disabled={pending} aria-disabled={pending}>
      {pending ? 'Sending…' : 'Request this time'}
    </button>
  )
}

const hour12 = (s: string) => {
  const h = Number(s.slice(0, 2))
  return `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`
}

export function AppointmentForm({
  dates,
  slots,
  taken,
  piece,
  defaultKind,
  defaultDate,
  sitting,
}: {
  dates: { value: string; label: string }[]
  slots: string[]
  taken: string[]
  piece: { slug: string; name: string } | null
  defaultKind: 'STORE_VISIT' | 'VIDEO_CALL'
  defaultDate?: string
  sitting?: 'morning' | 'evening'
}) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await requestAppointment(prev, fd)
    if (r?.ok) track('appointment_booked', { kind: String(fd.get('kind')), piece: piece?.slug })
    return r
  }, null)
  const v = state?.values
  const [date, setDate] = useState(v?.date ?? defaultDate ?? dates[0]?.value)
  // From the calendar: preselect the first free slot in the chosen sitting.
  const preferred = sitting ? slots.find((s) => !taken.includes(`${date} ${s}`) && (sitting === 'morning' ? Number(s.slice(0, 2)) < 14 : Number(s.slice(0, 2)) >= 16)) : undefined
  const e = state?.errors ?? {}

  if (state?.ok) {
    return (
      <div role="status" className="border-t border-rule pt-10">
        <h2 className="text-step-4">Thank you. Your time is held.</h2>
        <p className="measure mt-4 text-ink-muted">
          We’ll confirm on WhatsApp before the day{piece ? `, with the ${piece.name} set aside for you` : ''}. If you need to change anything, just reply to that message.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-12" noValidate>
      {piece && (
        <p className="border-l border-argent pl-4">
          We’ll have the <strong className="font-medium">{piece.name}</strong> ready for you.
          <input type="hidden" name="pieces" value={piece.slug} />
        </p>
      )}

      <fieldset>
        <legend className="font-display text-step-3">How would you like to see it?</legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['STORE_VISIT', 'At the store', 'Gorai 1, Borivali West'],
            ['VIDEO_CALL', 'On a video call', 'WhatsApp video, from anywhere'],
          ].map(([value, title, sub]) => (
            <label key={value} className="flex cursor-pointer gap-3 border border-rule p-4 has-[:checked]:border-argent">
              <input type="radio" name="kind" value={value} defaultChecked={(v?.kind ?? defaultKind) === value} className="mt-1.5 accent-[var(--argent)]" />
              <span>
                <span className="block">{title}</span>
                <span className="block text-step--1 text-ink-muted">{sub}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-step-3">When?</legend>
        <label htmlFor="f-date" className="label mt-5">Day</label>
        <select id="f-date" name="date" className="field" value={date} onChange={(ev) => setDate(ev.target.value)} aria-invalid={Boolean(e.date)}>
          {dates.map((d) => (
            <option key={d.value} value={d.value} className="bg-ground">{d.label}</option>
          ))}
        </select>
        {e.date && <p className="mt-1 text-step--1 text-ruby-bright">{e.date}</p>}

        <p id="slot-label" className="label mt-6">Time</p>
        <div role="radiogroup" aria-labelledby="slot-label" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((s) => {
            const busy = taken.includes(`${date} ${s}`)
            return (
              <label key={s} className={`num flex min-h-12 cursor-pointer items-center justify-center border border-rule text-step--1 has-[:checked]:border-argent has-[:checked]:bg-ground-raised ${busy ? 'cursor-not-allowed opacity-35 line-through' : ''}`}>
                <input type="radio" name="slot" value={s} disabled={busy} defaultChecked={(v?.slot ?? preferred) === s} className="sr-only" />
                {hour12(s)}
              </label>
            )
          })}
        </div>
        {e.slot && <p className="mt-2 text-step--1 text-ruby-bright">{e.slot}</p>}
      </fieldset>

      <fieldset>
        <legend className="font-display text-step-3">Who should we expect?</legend>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {[
            ['name', 'Your name', 'text', 'name'],
            ['phone', 'Mobile (for the WhatsApp confirmation)', 'tel', 'tel-national'],
            ['email', 'Email (optional)', 'email', 'email'],
          ].map(([name, label, type, ac]) => (
            <div key={name} className={name === 'name' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`f-${name}`} className="label">{label}</label>
              <input id={`f-${name}`} name={name} type={type} autoComplete={ac} defaultValue={v?.[name]} className="field" aria-invalid={Boolean(e[name])} />
              {e[name] && <p className="mt-1 text-step--1 text-ruby-bright">{e[name]}</p>}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="f-notes" className="label">Anything we should know? An occasion, a budget, other pieces to bring out (optional)</label>
            <textarea id="f-notes" name="notes" rows={3} defaultValue={v?.notes} className="field resize-none" />
          </div>
        </div>
      </fieldset>

      <div>
        <Submit />
        <p role="status" aria-live="polite" className="mt-3 text-step--1 text-ruby-bright">{state && !state.ok ? state.message : ''}</p>
      </div>
    </form>
  )
}
