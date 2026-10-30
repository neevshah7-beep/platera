/**
 * Categories shown in their original photographs, with no cut-out and no 3D scene (the
 * client's decision of 2026-10-30): the rooms are a tap-to-view photo grid, and the piece
 * page shows the photographs instead of the lamp. Their main image (-01) is the first
 * photograph, framed close on the piece (scripts/make_frames.py).
 */
export const PHOTO_CATEGORIES = ['rings', 'pendants', 'bangles'] as const

export function isPhotoCategory(slug: string | undefined | null) {
  return !!slug && (PHOTO_CATEGORIES as readonly string[]).includes(slug)
}

/** Two pieces from the men's ring shoot are women's designs. */
const WOMENS_FROM_MENS_SHOOT = new Set(['PLT-RNG-146', 'PLT-RNG-148'])

/** Men's rings are PLT-RNG-084 onward (the men's ring shoot of 2026-10-28). */
export function ringGroup(sku: string): "Men's" | "Women's" | null {
  const m = /^PLT-RNG-(\d{3})$/.exec(sku)
  if (!m) return null
  return Number(m[1]) >= 84 && !WOMENS_FROM_MENS_SHOOT.has(sku) ? "Men's" : "Women's"
}
