'use server'

import { redirect } from 'next/navigation'
import { checkoutSchema, fieldErrors } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { createOrderFromBag } from './create'
import { orderToken } from './token'

export type CheckoutState = { errors: Record<string, string>; message?: string; values?: Record<string, string> } | null

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  // React resets the form after an action; send the typed values back so nothing is lost.
  const values = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>

  if (!(await rateLimit('checkout', 8, 60))) {
    return { errors: {}, message: 'Too many attempts. Please wait a minute and try again.', values }
  }

  const parsed = checkoutSchema.safeParse({
    email: form.get('email'),
    address: {
      name: form.get('name'),
      phone: form.get('phone'),
      line1: form.get('line1'),
      line2: form.get('line2') ?? '',
      city: form.get('city'),
      state: form.get('state'),
      pincode: form.get('pincode'),
    },
    giftMessage: form.get('giftMessage') ?? '',
    hidePrices: form.get('hidePrices') === 'on',
    acceptPolicy: form.get('acceptPolicy') === 'on',
  })
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: 'Please check the highlighted fields.', values }

  const result = await createOrderFromBag(parsed.data)
  if (!result.ok) {
    if (result.code === 'PRICES_CHANGED') redirect('/bag?changed=1')
    if (result.code === 'UNAVAILABLE') redirect('/bag?unavailable=1')
    if (result.code === 'EMPTY') redirect('/bag')
    return { errors: {}, message: 'We couldn’t reach the payment provider. Nothing has been charged. Please try again in a moment.', values }
  }
  redirect(`/checkout/pay/${result.number}?t=${orderToken(result.orderId)}`)
}
