import originals from '@/data/originals.json'
import studio from '@/data/studio.json'

/** The original store photographs of a piece (no background removal), as base URLs. */
export function originalsFor(sku: string): string[] {
  return ((originals as Record<string, string[]>)[sku] ?? []).map((n) => `/media/originals/${n}`)
}

/**
 * The studio images of a piece, as base URLs (-800 / -1600 .webp): images made from the
 * owner's photographs to show the design clearly. Always labelled as studio images, never
 * as store photographs.
 */
export function studioFor(sku: string): string[] {
  return ((studio as Record<string, string[]>)[sku] ?? []).map((n) => `/media/studio/${n}`)
}
