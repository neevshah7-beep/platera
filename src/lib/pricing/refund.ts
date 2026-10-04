import { computePrice } from './compute'
import type { Breakdown, LineKey, PriceInput, RateSnapshot } from './types'

export type RefundBasis = 'CURRENT_RATE' | 'CAPPED_AT_PAID' | 'FIXED_LESS_GST'

export interface RefundBreakdown {
  refundPaise: number
  basis: RefundBasis
  /** What is kept, line by line, so the customer sees exactly why the refund is what it is. */
  withheld: { key: LineKey; label: string; paise: number }[]
  /** Metal value at today's rate, before the cap. Absent for fixed-price pieces. */
  currentMetalPaise?: number
}

/**
 * Return refund per the client's policy (docs/CLIENT_DECISIONS.md §3):
 * - Live-rate pieces: metal at today's rate, capped at the metal value paid,
 *   plus any stone value paid. Making, hallmarking and GST are kept.
 * - Fixed-price pieces: price paid less GST.
 */
export function computeReturnRefund(args: {
  input: PriceInput
  paid: Breakdown
  currentRate?: RateSnapshot
}): RefundBreakdown {
  const { input, paid, currentRate } = args
  const paidLine = (key: LineKey) => paid.lines.find((l) => l.key === key)?.paise ?? 0

  if (input.mode === 'FIXED') {
    return {
      refundPaise: paid.totalPaise - paid.gstPaise,
      basis: 'FIXED_LESS_GST',
      withheld: [{ key: 'gst', label: 'GST', paise: paid.gstPaise }],
    }
  }

  if (!currentRate) throw new Error('A live-rate return needs the current rate')

  const today = computePrice(input, currentRate)
  const currentMetal = today.lines.find((l) => l.key === 'metal')!.paise
  const paidMetal = paidLine('metal')
  const capped = currentMetal > paidMetal
  const metalRefund = capped ? paidMetal : currentMetal
  const stone = paidLine('stone')

  const withheld: RefundBreakdown['withheld'] = [
    { key: 'making', label: 'Making charge', paise: paidLine('making') },
    { key: 'hallmark', label: 'Hallmarking', paise: paidLine('hallmark') },
    { key: 'gst', label: 'GST', paise: paid.gstPaise },
  ].filter((w) => w.paise > 0) as RefundBreakdown['withheld']

  if (metalRefund < paidMetal) {
    withheld.push({ key: 'metal', label: 'Change in metal rate', paise: paidMetal - metalRefund })
  }

  return {
    refundPaise: metalRefund + stone,
    basis: capped ? 'CAPPED_AT_PAID' : 'CURRENT_RATE',
    withheld,
    currentMetalPaise: currentMetal,
  }
}
