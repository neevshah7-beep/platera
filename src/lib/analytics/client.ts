'use client'

import type { EventName } from './events'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

const META_STANDARD: Partial<Record<EventName, string>> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  appointment_booked: 'Schedule',
  whatsapp_enquiry: 'Contact',
}

/**
 * Sends one event to GA4 and, where there's a standard equivalent, to the Meta
 * Pixel with an event_id so the server-side Conversions API copy is deduplicated.
 * Both tags only exist after consent (see ConsentAndTags); before that this is a no-op.
 */
export function track(name: EventName, params: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === 'undefined') return
  const id = eventId ?? `${name}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
  window.gtag?.('event', name, { ...params, event_id: id })
  const meta = META_STANDARD[name]
  if (meta) window.fbq?.('track', meta, params, { eventID: id })
  else window.fbq?.('trackCustom', name, params, { eventID: id })
}
