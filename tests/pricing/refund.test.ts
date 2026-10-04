import { describe, expect, it } from 'vitest'
import { computePrice } from '@/lib/pricing/compute'
import { computeReturnRefund } from '@/lib/pricing/refund'
import type { PriceInput, RateSnapshot } from '@/lib/pricing/types'

const rate = (paisePerGram: number, id: string): RateSnapshot => ({
  id,
  metal: 'SILVER_925',
  paisePerGram,
  effectiveAt: new Date('2026-10-04T04:30:00Z'),
})

const live: PriceInput = {
  mode: 'LIVE',
  metal: 'SILVER_925',
  netWeightMg: 40_000,
  makingPct: 20,
  stonePaise: 0,
  hallmarkPaise: 4_500,
}

describe('computeReturnRefund — live rate pieces', () => {
  const paid = computePrice(live, rate(12_000, 'paid')) // metal ₹4,800.00

  it('refunds metal at the current rate when it has fallen', () => {
    const r = computeReturnRefund({ input: live, paid, currentRate: rate(11_000, 'today') })
    expect(r.refundPaise).toBe(440_000)
    expect(r.basis).toBe('CURRENT_RATE')
  })

  it('caps the metal refund at the metal value paid when the rate has risen', () => {
    const r = computeReturnRefund({ input: live, paid, currentRate: rate(13_500, 'today') })
    expect(r.refundPaise).toBe(480_000)
    expect(r.basis).toBe('CAPPED_AT_PAID')
  })

  it('never refunds making, GST or hallmarking', () => {
    const r = computeReturnRefund({ input: live, paid, currentRate: rate(12_000, 'today') })
    const withheld = Object.fromEntries(r.withheld.map((w) => [w.key, w.paise]))
    expect(withheld.making).toBe(96_000)
    expect(withheld.gst).toBe(paid.gstPaise)
    expect(withheld.hallmark).toBe(4_500)
    expect(r.refundPaise + r.withheld.reduce((s, w) => s + w.paise, 0)).toBe(paid.totalPaise)
  })

  it('requires today’s rate for a live piece', () => {
    expect(() => computeReturnRefund({ input: live, paid })).toThrow(/current rate/)
  })
})

describe('computeReturnRefund — fixed price pieces', () => {
  it('refunds the price paid minus GST', () => {
    const input: PriceInput = { mode: 'FIXED', pricePaise: 515_000 }
    const paid = computePrice(input)
    const r = computeReturnRefund({ input, paid })
    expect(r.refundPaise).toBe(500_000)
    expect(r.basis).toBe('FIXED_LESS_GST')
  })
})
