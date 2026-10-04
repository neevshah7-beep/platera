import { createHmac } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/payments/razorpay'

beforeAll(() => {
  process.env.RAZORPAY_KEY_SECRET = 'test_key_secret'
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
})

const hmac = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex')

describe('verifyPaymentSignature', () => {
  it('accepts the signature Razorpay computes over order_id|payment_id', () => {
    const sig = hmac('test_key_secret', 'order_ABC|pay_XYZ')
    expect(verifyPaymentSignature('order_ABC', 'pay_XYZ', sig)).toBe(true)
  })
  it('rejects a signature for a different payment', () => {
    const sig = hmac('test_key_secret', 'order_ABC|pay_OTHER')
    expect(verifyPaymentSignature('order_ABC', 'pay_XYZ', sig)).toBe(false)
  })
  it('rejects a signature made with the wrong secret, and junk', () => {
    expect(verifyPaymentSignature('order_ABC', 'pay_XYZ', hmac('wrong', 'order_ABC|pay_XYZ'))).toBe(false)
    expect(verifyPaymentSignature('order_ABC', 'pay_XYZ', 'not-hex')).toBe(false)
    expect(verifyPaymentSignature('order_ABC', 'pay_XYZ', '')).toBe(false)
  })
})

describe('verifyWebhookSignature', () => {
  const body = JSON.stringify({ event: 'payment.captured', payload: {} })
  it('accepts a body signed with the webhook secret', () => {
    expect(verifyWebhookSignature(body, hmac('test_webhook_secret', body))).toBe(true)
  })
  it('rejects a tampered body or a missing header', () => {
    expect(verifyWebhookSignature(body + ' ', hmac('test_webhook_secret', body))).toBe(false)
    expect(verifyWebhookSignature(body, null)).toBe(false)
  })
})
