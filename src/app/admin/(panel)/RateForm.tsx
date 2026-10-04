'use client'

import { useActionState, useState } from 'react'
import { updateRate, type RateState } from './actions'

export function RateForm({ currentRupees }: { currentRupees: string }) {
  const [state, action, pending] = useActionState<RateState, FormData>(updateRate, null)
  const needsConfirm = state && !state.ok && state.message.startsWith('That’s a big change')
  const [value, setValue] = useState(currentRupees)

  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <input type="hidden" name="metal" value="SILVER_925" />
      {needsConfirm && <input type="hidden" name="confirmBigMove" value="yes" />}
      <div className="flex-1">
        <label htmlFor="rate" className="label">925 silver, rupees per gram</label>
        <div className="flex items-baseline gap-2 border-b border-rule-light">
          <span className="font-display text-step-4">₹</span>
          <input
            id="rate"
            name="rate"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="num w-full bg-transparent py-2 font-display text-step-5 outline-none"
            aria-describedby="rate-msg"
            autoComplete="off"
          />
        </div>
      </div>
      <button className="btn btn-primary sm:min-w-44" disabled={pending}>{pending ? 'Updating…' : needsConfirm ? 'Yes, update' : 'Update rate'}</button>
      <p id="rate-msg" role="status" aria-live="polite" className={`sm:hidden ${state?.ok ? '' : 'text-garnet'}`}>{state?.message}</p>
      <p role="status" aria-live="polite" className={`hidden basis-full sm:block ${state?.ok ? '' : 'text-garnet'}`}>{state?.message}</p>
    </form>
  )
}
