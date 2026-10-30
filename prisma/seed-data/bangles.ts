/**
 * The bangle photographs of 2026-10-29 ("Bangles size 2/6"): 26 designs, each photographed as a
 * pair in the store's red boxes. Added by scripts/add-bangles.ts, never by the seed.
 *
 * Treated as the rings and pendants were (to be confirmed with the owner): 925 silver,
 * hallmarked, no HUID; live rate with no making charge; returns under the standard policy;
 * stones not described. No weights were given, so they are left for the counter to enter.
 */
import type { SeedRing } from './rings'

export const BANGLES_CATEGORY = {
  slug: 'bangles',
  name: 'Bangles',
  position: 7,
  summary: 'Bangles in hallmarked 925 silver, in pairs, from slim everyday bangles to festive designs.',
  seoTitle: 'Silver Bangles for Women | 925 Hallmarked | Platera',
  seoDescription:
    'Silver bangles for women in hallmarked 925 silver: pave, cutwork, coloured accent and polished designs, photographed in pairs. Bought on WhatsApp from Borivali West, Mumbai.',
  guide: `Every bangle here is 925 sterling silver and BIS hallmarked, photographed as it sits at our counter.

Look at the opening first. A bangle that opens should close with a firm click and sit flush, with no gap you can feel; a closed bangle should pass over the hand without strain and sit easily on the wrist bone.

Silver darkens in contact with air and sweat. Wipe bangles with a soft cloth after wearing, keep them away from perfume and lotion, and store each pair in its own pouch so the pave and cutwork do not scratch one another.

Ask on WhatsApp for the size you wear and for today's price, worked out from the weight at the day's silver rate.`,
} as const

export const BANGLES: SeedRing[] = [
  {
    sku: 'PLT-BNG-001', slug: 'wave-link-pave-bangles', name: 'Wave Link Pave Bangles', netWeightMg: null, photos: 0,
    summary: 'Wavy bangles of fine pave, linked by small open loops.',
    description: 'Each bangle flows in a gentle wave lined with sparkle, with polished links along its length. Graceful worn as a pair or stacked.',
  },
  {
    sku: 'PLT-BNG-002', slug: 'green-accent-wave-bangles', name: 'Green Accent Wave Bangles', netWeightMg: null, photos: 0,
    summary: 'Wavy pave bangles set with small green accents.',
    description: 'The waves of sparkle are punctuated with points of green. A festive pair with colour.',
  },
  {
    sku: 'PLT-BNG-003', slug: 'flower-stud-double-line-bangles', name: 'Flower Stud Double Line Bangles', netWeightMg: null, photos: 0,
    summary: 'Twin lines of polished silver joined by small sparkling flowers.',
    description: 'Open between the lines, so the bangles look light on the wrist. Elegant for everyday or occasions.',
  },
  {
    sku: 'PLT-BNG-004', slug: 'green-flower-stud-bangles', name: 'Green Flower Stud Bangles', netWeightMg: null, photos: 0,
    summary: 'Twin-line bangles with sparkling flowers and green accents.',
    description: 'The green points alternate with the flowers along the bangle. A pair with a touch of colour.',
  },
  {
    sku: 'PLT-BNG-005', slug: 'green-clover-bangles', name: 'Green Clover Bangles', netWeightMg: null, photos: 0,
    summary: 'A green clover at the centre of each bangle, with pave on either side.',
    description: 'The clover sits proud of a slim polished bangle. A bright, cheerful pair.',
  },
  {
    sku: 'PLT-BNG-006', slug: 'slim-green-clover-bangles', name: 'Slim Green Clover Bangles', netWeightMg: null, photos: 0,
    summary: 'Slim bangles with a green clover and a line of pave.',
    description: 'A lighter version of the clover design, comfortable to wear every day.',
  },
  {
    sku: 'PLT-BNG-007', slug: 'green-square-stud-bangles', name: 'Green Square Stud Bangles', netWeightMg: null, photos: 0,
    summary: 'Faceted bangles with framed green studs along their length.',
    description: 'Each green stud is framed in sparkle on a polished, angled band.',
  },
  {
    sku: 'PLT-BNG-008', slug: 'pave-plate-faceted-bangles', name: 'Pave Plate Faceted Bangles', netWeightMg: null, photos: 0,
    summary: 'Faceted bangles with a long plate of pave at the front.',
    description: 'The pave plate catches the light while the faceted sides keep a crisp outline.',
  },
  {
    sku: 'PLT-BNG-009', slug: 'red-dot-cutwork-bangles', name: 'Red Dot Cutwork Bangles', netWeightMg: null, photos: 0,
    summary: 'Cutwork bangles with a panel of pave and a line of red points.',
    description: 'Pierced flower patterns, sparkle and red accents along one polished band. A rich, festive pair.',
  },
  {
    sku: 'PLT-BNG-010', slug: 'engraved-cutwork-bangles', name: 'Engraved Cutwork Bangles', netWeightMg: null, photos: 0,
    summary: 'Slim bangles with an engraved and pierced pattern all the way round.',
    description: 'Fine cutwork gives the pair a delicate, traditional look.',
  },
  {
    sku: 'PLT-BNG-011', slug: 'segmented-block-bangles', name: 'Segmented Block Bangles', netWeightMg: null, photos: 0,
    summary: 'Polished segments with small motifs and a block of pave at the front.',
    description: 'The bangle is built of squared links, with sparkle at the centre. A modern, structured pair.',
  },
  {
    sku: 'PLT-BNG-012', slug: 'slim-pave-line-bangles', name: 'Slim Pave Line Bangles', netWeightMg: null, photos: 0,
    summary: 'Slim bangles lined with a single row of sparkle.',
    description: 'Light, simple and easy to stack with other bangles.',
  },
  {
    sku: 'PLT-BNG-013', slug: 'baguette-accent-bangles', name: 'Baguette Accent Bangles', netWeightMg: null, photos: 0,
    summary: 'Polished bangles with small baguette accents set along the front.',
    description: 'Clean lines of silver with points of sparkle. Smart for everyday wear.',
  },
  {
    sku: 'PLT-BNG-014', slug: 'lattice-oval-accent-bangles', name: 'Lattice Oval Accent Bangles', netWeightMg: null, photos: 0,
    summary: 'Lattice-cut bangles with oval accents at the front.',
    description: 'The pierced lattice lightens the bangle, and the ovals add a soft highlight.',
  },
  {
    sku: 'PLT-BNG-015', slug: 'baguette-row-bangles', name: 'Baguette Row Bangles', netWeightMg: null, photos: 0,
    summary: 'A row of baguettes at the centre of each polished bangle.',
    description: 'The baguettes sit in a short line across the front. Neat and elegant.',
  },
  {
    sku: 'PLT-BNG-016', slug: 'pave-panel-bangles', name: 'Pave Panel Bangles', netWeightMg: null, photos: 0,
    summary: 'Polished bangles with a panel of pave and stepped baguettes.',
    description: 'Two kinds of sparkle on one bangle: a fine pave panel and a row of baguettes.',
  },
  {
    sku: 'PLT-BNG-017', slug: 'square-stud-polished-bangles', name: 'Square Stud Polished Bangles', netWeightMg: null, photos: 0,
    summary: 'Smooth polished bangles with square sparkling studs.',
    description: 'The studs are set at intervals around the band. Simple and refined.',
  },
  {
    sku: 'PLT-BNG-018', slug: 'pink-pear-halo-bangles', name: 'Pink Pear Halo Bangles', netWeightMg: null, photos: 0,
    summary: 'A pink pear in a halo of sparkle at the front of each bangle.',
    description: 'A pair with real colour, the pink centres framed by fine sparkle on polished silver.',
  },
  {
    sku: 'PLT-BNG-019', slug: 'open-window-pave-bangles', name: 'Open Window Pave Bangles', netWeightMg: null, photos: 0,
    summary: 'Polished bangles with open windows and lines of pave.',
    description: 'The cut-out windows give the bangles a modern, architectural look.',
  },
  {
    sku: 'PLT-BNG-020', slug: 'sunburst-oval-bangles', name: 'Sunburst Oval Bangles', netWeightMg: null, photos: 0,
    summary: 'A sunburst oval of sparkle at the front of each bangle.',
    description: 'The oval centre is set like a flower opening, on a smooth polished band.',
  },
  {
    sku: 'PLT-BNG-021', slug: 'half-pave-polished-bangles', name: 'Half Pave Polished Bangles', netWeightMg: null, photos: 0,
    summary: 'Polished bangles with a long stretch of pave across the front.',
    description: 'Half sparkle, half smooth silver. Easy to wear every day.',
  },
  {
    sku: 'PLT-BNG-022', slug: 'chain-link-bangles', name: 'Chain Link Bangles', netWeightMg: null, photos: 0,
    summary: 'Bangles shaped like a curb chain, with sparkle on each link.',
    description: 'A pair with the look of a chain and the shape of a bangle.',
  },
  {
    sku: 'PLT-BNG-023', slug: 'polished-pave-end-bangles', name: 'Polished Pave End Bangles', netWeightMg: null, photos: 0,
    summary: 'Smooth polished bangles with panels of pave at the ends.',
    description: 'Clean and modern, with sparkle where the bangle opens.',
  },
  {
    sku: 'PLT-BNG-024', slug: 'leaf-braid-bangles', name: 'Leaf Braid Bangles', netWeightMg: null, photos: 0,
    summary: 'Bangles worked in a braided leaf pattern all the way round.',
    description: 'The leaves overlap like a plait, polished on the high points. A traditional, textured pair.',
  },
  {
    sku: 'PLT-BNG-025', slug: 'pave-stack-bangles', name: 'Pave Stack Bangles', netWeightMg: null, photos: 0,
    summary: 'Slim bangles with bands of pave, shown as a stack.',
    description: 'Wear them together for a full sparkle, or one at a time.',
  },
  {
    sku: 'PLT-BNG-026', slug: 'two-tone-flower-stud-bangles', name: 'Two-Tone Flower Stud Bangles', netWeightMg: null, photos: 0,
    summary: 'Twin-line bangles with sparkling flowers and a warm two-tone finish.',
    description: 'The flower studs sit between two polished lines with a soft rose tone.',
  },
]
