import { describe, expect, it } from 'vitest'
import { repriceCart } from '@/lib/pricing/reprice'
import type { PriceInput, RateSnapshot } from '@/lib/pricing/types'

const rates = (silver: number): Partial<Record<string, RateSnapshot>> => ({
  SILVER_925: { id: `s${silver}`, metal: 'SILVER_925', paisePerGram: silver, effectiveAt: new Date() },
})

const live: PriceInput = {
  mode: 'LIVE', metal: 'SILVER_925', netWeightMg: 10_000, makingPct: 10, stonePaise: 0, hallmarkPaise: 0,
}
const fixed: PriceInput = { mode: 'FIXED', pricePaise: 250_000 }

describe('repriceCart', () => {
  // at ₹120/g: metal 1200.00, making 120.00, taxable 1320.00, gst 39.60 → 1359.60
  it('reports no change when the customer saw the current price', () => {
    const r = repriceCart([{ id: 'a', input: live, seenTotalPaise: 135_960 }], rates(12_000))
    expect(r.changed).toBe(false)
    expect(r.lines[0].deltaPaise).toBe(0)
  })

  it('flags only the lines whose price moved, with the delta', () => {
    const r = repriceCart(
      [
        { id: 'a', input: live, seenTotalPaise: 135_960 },
        { id: 'b', input: fixed, seenTotalPaise: 250_000 },
      ],
      rates(12_500),
    )
    expect(r.changed).toBe(true)
    expect(r.lines.find((l) => l.id === 'a')?.changed).toBe(true)
    expect(r.lines.find((l) => l.id === 'a')?.deltaPaise).toBe(141_625 - 135_960)
    expect(r.lines.find((l) => l.id === 'b')?.changed).toBe(false)
    expect(r.totalPaise).toBe(141_625 + 250_000)
  })

  it('reports a fall in price as a change too', () => {
    const r = repriceCart([{ id: 'a', input: live, seenTotalPaise: 135_960 }], rates(11_000))
    expect(r.changed).toBe(true)
    expect(r.lines[0].deltaPaise).toBeLessThan(0)
  })
})
