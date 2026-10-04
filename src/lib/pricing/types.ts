/**
 * Pricing vocabulary. Money is integer paise, weight is integer milligrams.
 * Nothing in this module touches the database or the network, so the same
 * code prices the PDP, the cart, checkout, refunds and the Merchant feed.
 */

export type MetalKey = 'SILVER_925' | 'GOLD_22K' | 'GOLD_18K' | 'GOLD_14K' | 'PLATINUM_950'

export const MAKING_PERCENTAGES = [10, 15, 20] as const
export type MakingPct = (typeof MAKING_PERCENTAGES)[number]

export const GST_PERCENT = 3

export type PriceInput =
  | {
      mode: 'LIVE'
      metal: MetalKey
      netWeightMg: number
      makingPct: MakingPct
      stonePaise: number
      hallmarkPaise: number
    }
  | {
      mode: 'FIXED'
      /** Selling price including GST. */
      pricePaise: number
    }

export interface RateSnapshot {
  id: string
  metal: MetalKey
  paisePerGram: number
  effectiveAt: Date
}

export type LineKey = 'metal' | 'making' | 'stone' | 'hallmark' | 'value' | 'gst'

export interface Line {
  key: LineKey
  label: string
  /** The arithmetic, in words a customer can check: "24.360 g × ₹128.50 per g". */
  detail: string
  paise: number
}

export interface Breakdown {
  lines: Line[]
  taxablePaise: number
  gstPaise: number
  totalPaise: number
  rate?: RateSnapshot
}

export const METAL_LABEL: Record<MetalKey, string> = {
  SILVER_925: '925 sterling silver',
  GOLD_22K: '22 karat gold',
  GOLD_18K: '18 karat gold',
  GOLD_14K: '14 karat gold',
  PLATINUM_950: '950 platinum',
}
