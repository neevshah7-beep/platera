import { formatGrams, formatINR } from './format'
import { GST_PERCENT, type Breakdown, type Line, type PriceInput, type RateSnapshot } from './types'

/**
 * Exact integer division rounded half-up, for non-negative integers.
 * Floating-point `Math.round(a * b / 1000)` can land on x.4999… at a true half,
 * which would make the Ledger's arithmetic disagree with itself by a paisa.
 */
export function divRoundHalfUp(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || numerator < 0 || denominator <= 0) {
    throw new RangeError(`divRoundHalfUp expects non-negative safe integers, got ${numerator}/${denominator}`)
  }
  return Math.floor((2 * numerator + denominator) / (2 * denominator))
}

export function computePrice(input: PriceInput, rate?: RateSnapshot): Breakdown {
  if (input.mode === 'FIXED') return computeFixed(input.pricePaise)

  if (!rate) throw new Error(`A live-rate piece needs today's rate for ${input.metal}`)
  if (rate.metal !== input.metal) {
    throw new Error(`Expected a rate for ${input.metal}, received ${rate.metal}`)
  }

  const metal = divRoundHalfUp(rate.paisePerGram * input.netWeightMg, 1000)
  const making = divRoundHalfUp(metal * input.makingPct, 100)

  const lines: Line[] = [
    {
      key: 'metal',
      label: 'Metal value',
      detail: `${formatGrams(input.netWeightMg)} × ${formatINR(rate.paisePerGram)} per g`,
      paise: metal,
    },
    { key: 'making', label: 'Making charge', detail: `${input.makingPct}% of metal value`, paise: making },
  ]
  if (input.stonePaise > 0) {
    lines.push({ key: 'stone', label: 'Stones', detail: 'Stone value as set', paise: input.stonePaise })
  }
  if (input.hallmarkPaise > 0) {
    lines.push({ key: 'hallmark', label: 'Hallmarking', detail: 'BIS hallmark and HUID', paise: input.hallmarkPaise })
  }

  const taxable = lines.reduce((sum, l) => sum + l.paise, 0)
  const gst = divRoundHalfUp(taxable * GST_PERCENT, 100)
  lines.push({ key: 'gst', label: 'GST', detail: `${GST_PERCENT}% of ${formatINR(taxable)}`, paise: gst })

  return { lines, taxablePaise: taxable, gstPaise: gst, totalPaise: taxable + gst, rate }
}

function computeFixed(pricePaise: number): Breakdown {
  const taxable = divRoundHalfUp(pricePaise * 100, 100 + GST_PERCENT)
  const gst = pricePaise - taxable
  return {
    lines: [
      { key: 'value', label: 'Piece value', detail: 'Fixed price', paise: taxable },
      { key: 'gst', label: 'GST', detail: `${GST_PERCENT}%, included`, paise: gst },
    ],
    taxablePaise: taxable,
    gstPaise: gst,
    totalPaise: pricePaise,
  }
}
