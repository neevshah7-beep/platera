'use client'

import { useActionState } from 'react'
import { confirmCode, requestCode, type LoginState } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    (prev, fd) => (fd.get('code') !== null ? confirmCode(prev, fd) : requestCode(prev, fd)),
    null,
  )

  if (state?.step === 'code') {
    return (
      <form action={action} className="mt-8 space-y-6">
        <p className="text-ink-light-muted">{state.message}</p>
        <input type="hidden" name="email" value={state.email} />
        <div>
          <label htmlFor="code" className="label">Six-digit code</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field num text-step-3 tracking-[0.3em]" autoFocus />
        </div>
        <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Checking…' : 'Sign in'}</button>
      </form>
    )
  }

  return (
    <form action={action} className="mt-8 space-y-6">
      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" className="field" autoFocus />
      </div>
      {state?.message && <p role="alert" className="text-step--1 text-ruby">{state.message}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Sending…' : 'Send me a code'}</button>
    </form>
  )
}
