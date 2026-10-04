'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { issueAdminCode, signOutAdmin, verifyAdminCode } from '@/lib/auth/admin'
import { sendEmail } from '@/lib/notify/email'
import { rateLimit } from '@/lib/rate-limit'

export type LoginState = { step: 'email' | 'code'; email?: string; message?: string } | null

export async function requestCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get('email'))
  if (!email.success) return { step: 'email', message: 'Enter the email address you were given access with.' }
  if (!(await rateLimit('admin-code', 5, 600))) return { step: 'email', message: 'Too many attempts. Wait ten minutes and try again.' }

  const issued = await issueAdminCode(email.data)
  if (issued) {
    const sent = await sendEmail(email.data, {
      subject: `Your Platera sign-in code: ${issued.code}`,
      heading: `Your code is ${issued.code}`,
      paragraphs: ['Enter it on the sign-in page. It works once and expires in 10 minutes. If you didn’t ask for it, ignore this email.'],
    })
    // Without an email provider in development, the code is printed to the server log.
    if (sent === 'skipped' && process.env.NODE_ENV !== 'production') console.info(`[admin sign-in code for ${email.data}] ${issued.code}`)
  }
  // Same answer either way, so the form doesn't reveal which addresses have access.
  return { step: 'code', email: email.data, message: 'If that address has access, a six-digit code is on its way.' }
}

export async function confirmCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '')
  const code = String(form.get('code') ?? '')
  if (!(await rateLimit('admin-verify', 10, 600))) return { step: 'code', email, message: 'Too many attempts. Wait ten minutes.' }
  if (!/^\d{6}$/.test(code.trim()) || !(await verifyAdminCode(email, code))) {
    return { step: 'code', email, message: 'That code didn’t work. Check it, or ask for a new one.' }
  }
  redirect('/admin')
}

export async function signOut() {
  await signOutAdmin()
  redirect('/admin/login')
}
