import { describe, expect, it } from 'vitest'
import { checkoutSchema, phoneSchema, rateSchema } from '@/lib/validation'

describe('phoneSchema', () => {
  it.each(['9876543210', '+91 98765 43210', '098765-43210', '919876543210'])('normalises %s', (input) => {
    expect(phoneSchema.parse(input)).toBe('9876543210')
  })
  it.each(['12345', '5876543210', 'abcdefghij'])('rejects %s', (input) => {
    expect(phoneSchema.safeParse(input).success).toBe(false)
  })
})

describe('rateSchema', () => {
  it('converts rupees per gram to integer paise', () => {
    expect(rateSchema.parse({ metal: 'SILVER_925', rupeesPerGram: '162.5' }).rupeesPerGram).toBe(16_250)
    expect(rateSchema.parse({ metal: 'SILVER_925', rupeesPerGram: '7240' }).rupeesPerGram).toBe(724_000)
  })
  it('refuses zero, negatives and three decimals', () => {
    for (const v of ['0', '-5', '162.555', 'abc']) {
      expect(rateSchema.safeParse({ metal: 'SILVER_925', rupeesPerGram: v }).success).toBe(false)
    }
  })
})

describe('checkoutSchema', () => {
  const valid = {
    email: 'Buyer@Example.com ',
    address: { name: 'A Buyer', phone: '98765 43210', line1: '12 Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400091' },
    acceptPolicy: true,
  }
  it('accepts a complete order and normalises it', () => {
    const r = checkoutSchema.parse(valid)
    expect(r.email).toBe('buyer@example.com')
    expect(r.address.phone).toBe('9876543210')
  })
  it('requires the return conditions to be accepted', () => {
    expect(checkoutSchema.safeParse({ ...valid, acceptPolicy: false }).success).toBe(false)
  })
  it('rejects a PIN code starting with zero', () => {
    expect(checkoutSchema.safeParse({ ...valid, address: { ...valid.address, pincode: '012345' } }).success).toBe(false)
  })
})
