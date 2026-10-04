import { describe, expect, it } from 'vitest'
import { computePrice, divRoundHalfUp } from '@/lib/pricing/compute'
import type { RateSnapshot } from '@/lib/pricing/types'

const silver = (paisePerGram: number, id = 'r1'): RateSnapshot => ({
  id,
  metal: 'SILVER_925',
  paisePerGram,
  effectiveAt: new Date('2026-10-04T04:30:00Z'),
})

describe('divRoundHalfUp', () => {
  it('rounds exact halves up and everything else to nearest', () => {
    expect(divRoundHalfUp(5, 10)).toBe(1)
    expect(divRoundHalfUp(4, 10)).toBe(0)
    expect(divRoundHalfUp(15, 10)).toBe(2)
    expect(divRoundHalfUp(1_234_500, 1000)).toBe(1235)
  })
})

describe('computePrice — live rate', () => {
  // ₹128.50/g × 24.360 g = ₹3,130.26; making 15% = ₹469.54; taxable ₹3,599.80; GST ₹107.99
  const input = {
    mode: 'LIVE' as const,
    metal: 'SILVER_925' as const,
    netWeightMg: 24_360,
    makingPct: 15 as const,
    stonePaise: 0,
    hallmarkPaise: 0,
  }

  it('computes metal value from rate × net weight', () => {
    const b = computePrice(input, silver(12_850))
    expect(b.lines.find((l) => l.key === 'metal')?.paise).toBe(313_026)
  })

  it('applies the making charge as a percentage of metal value', () => {
    const b = computePrice(input, silver(12_850))
    expect(b.lines.find((l) => l.key === 'making')?.paise).toBe(46_954)
  })

  it.each([10, 15, 20] as const)('supports making at %i%%', (pct) => {
    const b = computePrice({ ...input, makingPct: pct }, silver(10_000))
    // metal = 100.00 × 24.36 = 2436.00
    expect(b.lines.find((l) => l.key === 'making')?.paise).toBe(243_600 * pct / 100)
  })

  it('charges 3% GST on the taxable total and sums correctly', () => {
    const b = computePrice(input, silver(12_850))
    expect(b.taxablePaise).toBe(359_980)
    expect(b.gstPaise).toBe(10_799) // 3% of 3599.80 = 107.994
    expect(b.totalPaise).toBe(370_779)
  })

  it('includes stone and hallmark lines only when non-zero', () => {
    const plain = computePrice(input, silver(12_850))
    expect(plain.lines.map((l) => l.key)).toEqual(['metal', 'making', 'gst'])
    const full = computePrice({ ...input, stonePaise: 50_000, hallmarkPaise: 4_500 }, silver(12_850))
    expect(full.lines.map((l) => l.key)).toEqual(['metal', 'making', 'stone', 'hallmark', 'gst'])
    expect(full.taxablePaise).toBe(359_980 + 54_500)
  })

  it('re-prices when the rate changes', () => {
    const a = computePrice(input, silver(12_850))
    const b = computePrice(input, silver(13_100, 'r2'))
    expect(b.totalPaise).toBeGreaterThan(a.totalPaise)
    expect(b.rate?.id).toBe('r2')
  })

  it('refuses a rate for a different metal', () => {
    expect(() =>
      computePrice(input, { ...silver(12_850), metal: 'GOLD_22K' }),
    ).toThrow(/rate for SILVER_925/)
  })

  it('refuses to price a live piece without a rate', () => {
    expect(() => computePrice(input)).toThrow(/rate/)
  })

  it('writes the arithmetic into each line', () => {
    const b = computePrice(input, silver(12_850))
    expect(b.lines[0].detail).toBe('24.360 g × ₹128.50 per g')
    expect(b.lines[1].detail).toBe('15% of metal value')
    expect(b.lines.at(-1)?.detail).toBe('3% of ₹3,599.80')
  })
})

describe('computePrice — fixed price', () => {
  it('treats the fixed price as GST-inclusive and backs out the tax', () => {
    const b = computePrice({ mode: 'FIXED', pricePaise: 515_000 })
    expect(b.totalPaise).toBe(515_000)
    expect(b.taxablePaise).toBe(500_000)
    expect(b.gstPaise).toBe(15_000)
    expect(b.rate).toBeUndefined()
  })

  it('keeps taxable + gst equal to the price when division is inexact', () => {
    const b = computePrice({ mode: 'FIXED', pricePaise: 299_900 })
    expect(b.taxablePaise + b.gstPaise).toBe(299_900)
  })
})
