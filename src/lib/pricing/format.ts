const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** ₹3,599.80 — the Ledger always shows paise. */
export function formatINR(paise: number): string {
  return inr.format(paise / 100)
}

/** ₹3,708 — headline prices round to the rupee; the Ledger carries the exact figure. */
export function formatINRWhole(paise: number): string {
  return inrWhole.format(Math.round(paise / 100))
}

/** 24.360 g */
export function formatGrams(mg: number): string {
  return `${(mg / 1000).toFixed(3)} g`
}
