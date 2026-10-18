/**
 * The ring shoot of 2026-10-17 (21 rings; a 22nd is still to be photographed).
 * Added by scripts/add-rings.ts, never by the seed.
 *
 * Owner's instructions: 925 silver, hallmarked, no HUID; live rate with no making
 * charge; one of each; returns under the standard policy. Ring size and stones are
 * not described. Net weights are the figures the owner wrote in the photo filenames;
 * rings with none are left unweighed for the owner to enter in admin.
 */
export type SeedRing = {
  sku: string
  slug: string
  name: string
  summary: string
  description: string
  netWeightMg: number | null
  /** Photos in assets/sorted after the main cut-out, as their two-digit index. */
  photos: number
}

export const RINGS_CATEGORY = {
  slug: 'rings',
  name: 'Rings',
  position: 5,
  summary: 'Rings in hallmarked 925 silver, one of each design.',
  seoTitle: 'Silver Rings for Women | 925 Hallmarked | Platera',
  seoDescription:
    'Silver rings for women in hallmarked 925 silver: hearts, solitaire styles, bands and statement rings. One of each, bought on WhatsApp from Borivali West, Mumbai.',
  guide: `Every ring here is 925 sterling silver and BIS hallmarked. Each design is a single piece, so what you see in the photographs is the ring you receive.

A ring is worn closer to work than any other piece, so look first at the band. It should be smooth and even on the inside, with no sharp edge where it meets the top. The top should sit level on the finger rather than tipping to one side.

Silver darkens in contact with air and sweat. Take rings off to wash your hands with soap or to use lotion, wipe them with a soft cloth after wearing, and store each in its own pouch so the tops don't scratch one another.

Ask the price on WhatsApp and we send today's price for the ring, worked out from its weight at the day's silver rate.`,
} as const

export const RINGS: SeedRing[] = [
  {
    sku: 'PLT-RNG-001', slug: 'filigree-heart-ring', name: 'Filigree Heart Ring', netWeightMg: null, photos: 3,
    summary: 'An open filigree heart, its scrolls framing a smaller sparkling heart at the centre.',
    description: 'The scrollwork is cut through, so light passes behind the centre and the heart looks finer than its size. It sits flat on a plain, slim band.',
  },
  {
    sku: 'PLT-RNG-002', slug: 'baguette-bar-ring', name: 'Baguette Bar Ring', netWeightMg: 1_870, photos: 1,
    summary: 'A slim band with a single straight bar set crosswise at the front.',
    description: 'A quiet, linear ring: one clean bar across a band marked with fine grooves. It suits everyday wear and stacks easily with other bands.',
  },
  {
    sku: 'PLT-RNG-003', slug: 'round-cluster-ring', name: 'Round Cluster Ring', netWeightMg: null, photos: 2,
    summary: 'A round, closely set cluster on a band with ribbed shoulders.',
    description: 'The cluster is divided into quarters around a raised centre, so it reads as one bright disc from a distance. The ribbed shoulders give the band a little weight at the sides.',
  },
  {
    sku: 'PLT-RNG-004', slug: 'scroll-crown-ring', name: 'Scroll Crown Ring', netWeightMg: 2_940, photos: 3,
    summary: 'Silver scrolls curl above and below the band, each holding a sparkling teardrop.',
    description: 'One teardrop points up and one points down, with the scrolls mirrored between them, so the ring looks the same from either side of the hand. A statement ring with a light, open build.',
  },
  {
    sku: 'PLT-RNG-005', slug: 'open-circle-ring', name: 'Open Circle Ring', netWeightMg: 1_770, photos: 1,
    summary: 'A small open circle, ringed with sparkle, where two curving arms of the band cross.',
    description: 'The centre of the circle is left open, so the skin shows through. A delicate ring for every day.',
  },
  {
    sku: 'PLT-RNG-006', slug: 'wave-and-hearts-ring', name: 'Wave and Hearts Ring', netWeightMg: 2_460, photos: 1,
    summary: 'A sparkling wave across the top, with three small rose-toned hearts riding above it.',
    description: 'The wave sweeps from one side of the band to the other, and the hearts follow its curve. The only ring in this group with a touch of warm colour.',
  },
  {
    sku: 'PLT-RNG-007', slug: 'split-shank-solitaire-ring', name: 'Split Shank Solitaire Ring', netWeightMg: 2_690, photos: 3,
    summary: 'A single large round centre held high, with a band that opens into two sparkling lines.',
    description: 'The split band leaves a gap on either side of the centre, which makes the setting look taller and lighter. A ring for occasions and for gifting.',
  },
  {
    sku: 'PLT-RNG-008', slug: 'open-double-bar-ring', name: 'Open Double Bar Ring', netWeightMg: 1_720, photos: 1,
    summary: 'Two sparkling bars across the top, joined at the ends with an open space between them.',
    description: 'Architectural and modern: straight lines and an open centre in place of a single stone. It sits low and comfortably on the finger.',
  },
  {
    sku: 'PLT-RNG-009', slug: 'classic-solitaire-ring', name: 'Classic Solitaire Ring', netWeightMg: 2_700, photos: 3,
    summary: 'A single round centre in a six-prong setting, on a band that sparkles along its top.',
    description: 'The classic solitaire shape: one raised centre, held by six fine prongs, with a line of small settings running down each side of the band.',
  },
  {
    sku: 'PLT-RNG-010', slug: 'bar-band-ring', name: 'Bar Band Ring', netWeightMg: 2_150, photos: 2,
    summary: 'A solid silver band with a single small centre held between two raised bars.',
    description: 'Simple and sturdy, with the centre set low so it does not catch. A good ring for someone who wears silver every day.',
  },
  {
    sku: 'PLT-RNG-011', slug: 'tapered-solitaire-ring', name: 'Tapered Solitaire Ring', netWeightMg: null, photos: 2,
    summary: 'A single round centre with sparkling shoulders that taper into a polished band.',
    description: 'The shoulders narrow as they leave the centre, drawing the eye to it. A traditional engagement-style ring in silver.',
  },
  {
    sku: 'PLT-RNG-012', slug: 'oval-loop-ring', name: 'Oval Loop Ring', netWeightMg: 1_450, photos: 1,
    summary: 'An oval centre inside open silver loops, with small clusters to either side.',
    description: 'The loops wrap around the centre without closing it in, so the ring looks open and light from above.',
  },
  {
    sku: 'PLT-RNG-013', slug: 'leaf-ring', name: 'Leaf Ring', netWeightMg: null, photos: 2,
    summary: 'A pair of leaves across the band: one in cut-through silver, one closely set.',
    description: 'The open leaf shows its veins in silver; its partner sparkles. A small, nature-led ring that sits flat on the finger.',
  },
  {
    sku: 'PLT-RNG-014', slug: 'hearts-within-a-heart-ring', name: 'Hearts Within a Heart Ring', netWeightMg: 2_310, photos: 1,
    summary: 'A sparkling heart with three smaller hearts cut out of its face.',
    description: 'The cut-out hearts are polished silver, so they shine against the sparkle around them. A gift ring with a clear meaning.',
  },
  {
    sku: 'PLT-RNG-015', slug: 'half-eternity-band', name: 'Half Eternity Band', netWeightMg: 2_090, photos: 1,
    summary: 'A slim band with a row of separate settings across the front half.',
    description: 'Each setting stands on its own, so the row catches light from every side. Wear it alone or stacked.',
  },
  {
    sku: 'PLT-RNG-016', slug: 'flower-swirl-ring', name: 'Flower Swirl Ring', netWeightMg: 2_850, photos: 3,
    summary: 'A flower-shaped cluster at the centre, wrapped in sweeping sparkling swirls.',
    description: 'The swirls rise above and below the flower, so the ring covers the finger like a cocktail ring while staying open and light. The boldest ring in the group.',
  },
  {
    sku: 'PLT-RNG-017', slug: 'oval-signet-ring', name: 'Oval Signet Ring', netWeightMg: 2_690, photos: 2,
    summary: 'A broad oval face, finely textured, set with three sparkling ovals.',
    description: 'A signet shape made decorative: the textured face frames the ovals so each one stands out. It sits flat and wide on the finger.',
  },
  {
    sku: 'PLT-RNG-018', slug: 'star-heart-ring', name: 'Star Heart Ring', netWeightMg: 2_780, photos: 1,
    summary: 'A heart with filigree at its top and a sparkling star at its centre.',
    description: 'The star is outlined in polished silver, with cut-through scrolls above it. A heart ring with more detail the closer you look.',
  },
  {
    sku: 'PLT-RNG-019', slug: 'double-wave-ring', name: 'Double Wave Ring', netWeightMg: 1_870, photos: 2,
    summary: 'Two polished waves across the top, each with a sparkling line along its curve.',
    description: 'The waves overlap at the centre, so the ring has movement even when the hand is still. Smooth silver and sparkle in equal measure.',
  },
  {
    sku: 'PLT-RNG-020', slug: 'twin-hearts-ring', name: 'Twin Hearts Ring', netWeightMg: 2_020, photos: 1,
    summary: 'Two small open hearts side by side, outlined in sparkle.',
    description: 'A light, playful ring: the hearts are open at the centre and sit just above the band.',
  },
  {
    sku: 'PLT-RNG-021', slug: 'pave-bar-ring', name: 'Pavé Bar Ring', netWeightMg: 1_720, photos: 1,
    summary: 'A rounded bar across the top, closely set in two neat rows.',
    description: 'Minimal and modern, with the bar set low on a slim band. An easy ring for every day.',
  },
]
