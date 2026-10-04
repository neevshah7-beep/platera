import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Order pages are reached by order number plus a signed token, so numbers can't be
 * guessed to read someone else's address. The token is an HMAC of the order id.
 */
function secret(): string {
  const s = process.env.ORDER_TOKEN_SECRET
  if (!s && process.env.NODE_ENV === 'production') throw new Error('ORDER_TOKEN_SECRET is not set')
  return s ?? 'dev-only-order-token-secret'
}

export function orderToken(orderId: string): string {
  return createHmac('sha256', secret()).update(`order:${orderId}`).digest('base64url').slice(0, 32)
}

export function checkOrderToken(orderId: string, token: string | undefined): boolean {
  if (!token) return false
  const a = Buffer.from(orderToken(orderId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export function newOrderNumber(now = new Date()): string {
  // Date in India, not UTC, so an order placed at 1 am on the 5th reads as the 5th.
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: '2-digit', month: '2-digit', day: '2-digit' }).format(now).replace(/-/g, '')
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  const tail = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  return `PLT-${ymd}-${tail}`
}
