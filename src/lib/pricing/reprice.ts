import { computePrice } from './compute'
import type { Breakdown, MetalKey, PriceInput, RateSnapshot } from './types'

export interface RepriceLine {
  id: string
  breakdown: Breakdown
  seenTotalPaise: number
  deltaPaise: number
  changed: boolean
}

/**
 * Re-prices a cart against today's rates and reports every line whose price moved
 * since the customer last saw it. Checkout refuses to take payment while `changed`
 * is true until the customer has seen the new figures.
 */
export function repriceCart(
  items: { id: string; input: PriceInput; seenTotalPaise: number }[],
  rates: Partial<Record<MetalKey | string, RateSnapshot>>,
): { changed: boolean; totalPaise: number; lines: RepriceLine[] } {
  const lines = items.map((item) => {
    const rate = item.input.mode === 'LIVE' ? rates[item.input.metal] : undefined
    const breakdown = computePrice(item.input, rate)
    const deltaPaise = breakdown.totalPaise - item.seenTotalPaise
    return { id: item.id, breakdown, seenTotalPaise: item.seenTotalPaise, deltaPaise, changed: deltaPaise !== 0 }
  })
  return {
    changed: lines.some((l) => l.changed),
    totalPaise: lines.reduce((s, l) => s + l.breakdown.totalPaise, 0),
    lines,
  }
}
