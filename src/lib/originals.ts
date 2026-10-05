import originals from '@/data/originals.json'

/** The original store photographs of a piece (no background removal), as base URLs. */
export function originalsFor(sku: string): string[] {
  return ((originals as Record<string, string[]>)[sku] ?? []).map((n) => `/media/originals/${n}`)
}
