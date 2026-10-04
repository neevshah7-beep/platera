/**
 * Catalogue copy for the launch pieces. Facts not visible in the photographs
 * (weight, length, stone material of coloured stones) are left for the owner to
 * enter in admin; nothing here guesses at them.
 *
 * `demoWeightMg` exists only so the storefront can be reviewed before the pieces
 * are weighed. The seed uses it only when SEED_DEMO_WEIGHTS=1, and even then the
 * piece is marked unverified unless that flag is set.
 */
export type SeedPiece = {
  sku: string
  slug: string
  category: 'necklaces' | 'payals' | 'earrings' | 'mangalsutras'
  name: string
  summary: string
  description: string
  finish?: string
  stoneType: 'NONE' | 'CUBIC_ZIRCONIA' | 'KUNDAN_GLASS' | 'MIXED'
  stoneDetails?: string
  returnable?: boolean
  returnNote?: string
  featured?: boolean
  demoWeightMg: number
}

const EARRING_RETURN =
  'The earrings in this set can be returned only unworn, with their backs and seal intact.'

export const PIECES: SeedPiece[] = [
  {
    sku: 'NKS-001', slug: 'five-petal-necklace-set', category: 'necklaces', featured: true,
    name: 'Five Petal Necklace Set',
    summary: 'Open five-petal flowers, outlined in cubic zirconia, gather at one side of a triple silver bar.',
    description:
      'The flowers are cut open, so the skin shows through each petal and the piece looks lighter than its size. The triple bar keeps the cluster turned outward when you move. The matching earrings repeat a single pair of flowers on a short drop.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia, pavé-set along every petal and bar',
    returnNote: EARRING_RETURN, demoWeightMg: 41_200,
  },
  {
    sku: 'NKS-002', slug: 'riviera-drop-necklace', category: 'necklaces',
    name: 'Riviera Drop Necklace',
    summary: 'A single line of graduated drops, each holding one stone, that falls evenly around the neck.',
    description:
      'Every drop hangs from its own hinge, so the line follows the collarbone instead of sitting stiffly on it. It is a piece for an open neckline, with nothing at the centre to compete with the line itself.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia, one stone per drop', demoWeightMg: 27_800,
  },
  {
    sku: 'NKS-003', slug: 'peacock-pendant-lilac-cord', category: 'necklaces',
    name: 'Peacock Pendant on Lilac Cord',
    summary: 'A gold-plated peacock pendant ringed with white stones, hung on a soft multi-strand lilac cord.',
    description:
      'The peacock is worked in relief at the centre, with a frame of white stones and a single coloured drop below. The cord makes it light enough for a full day. The earrings are small temple-style jhumkis with the same pink and green accents.',
    finish: 'Gold plated', stoneType: 'MIXED', stoneDetails: 'White stones with pink and green accents (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 22_500,
  },
  {
    sku: 'NKS-004', slug: 'open-square-necklace-set', category: 'necklaces', featured: true,
    name: 'Open Square Necklace Set',
    summary: 'Graduated open squares, each edged in stones, step down to a heavier centre.',
    description:
      'This is the most architectural piece in the collection: straight edges, open centres and a strict rhythm from small to large. It suits a plain collar or a sari blouse with a high back. The earrings are two stacked squares.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia, channel- and pavé-set',
    returnNote: EARRING_RETURN, demoWeightMg: 48_600,
  },
  {
    sku: 'NKS-005', slug: 'winged-pear-necklace-set', category: 'necklaces', featured: true,
    name: 'Winged Pear Necklace Set',
    summary: 'A cluster of pear-cut stones at the centre, with fanned silver wings to either side.',
    description:
      'The wings are fine fluted wires that catch light along their length, so the centre looks as if it is opening. Linked ovals carry the line up to the clasp. The earrings take the pear cluster and hang it from a small stud.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia, pear and round cuts',
    returnNote: EARRING_RETURN, demoWeightMg: 38_900,
  },
  {
    sku: 'NKS-006', slug: 'fringe-line-necklace', category: 'necklaces',
    name: 'Fringe Line Necklace',
    summary: 'A fine chain with a fringe of short stone drops that lengthen towards the centre.',
    description:
      'Quiet from a distance and busy close up: each drop moves on its own as you turn your head. It sits well over a high neckline as well as on bare skin.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia', demoWeightMg: 19_400,
  },
  {
    sku: 'NKS-007', slug: 'peacock-medallion-on-cord', category: 'necklaces',
    name: 'Peacock Medallion on Cord',
    summary: 'A large gold-plated medallion with an enamelled peacock, set with a red drop and green stones.',
    description:
      'This is the boldest of the cord pieces: blue and green enamel feathers fill the medallion, framed by a band of white stones. It is worn at the base of the neck on a multi-strand cord. The earrings are small enamelled studs to match.',
    finish: 'Gold plated', stoneType: 'MIXED', stoneDetails: 'Enamel work with white, red and green stones (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 31_000,
  },
  {
    sku: 'NKS-008', slug: 'small-peacock-pendant-set', category: 'necklaces',
    name: 'Small Peacock Pendant Set',
    summary: 'A smaller peacock pendant in gold plate and enamel, on a rose cord, with matching drops.',
    description:
      'The same motif as the medallion, scaled down for everyday wear. The pendant tilts slightly on the cord so the enamel shows in profile. It is an easy first piece for someone who doesn’t usually wear colour.',
    finish: 'Gold plated', stoneType: 'MIXED', stoneDetails: 'Enamel with pink and white stones (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 18_300,
  },
  {
    sku: 'NKS-009', slug: 'rose-drop-necklace-set', category: 'necklaces',
    name: 'Rose Drop Necklace Set',
    summary: 'Open silver links lead to a fan-shaped drop with a single rose-pink stone.',
    description:
      'The links are cut with small windows, which keeps a long chain light. The pink stone is the only colour in the piece, and the earrings repeat it in the same fan shape.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia with one pink stone (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 29_700,
  },
  {
    sku: 'NKS-010', slug: 'krishna-pendant-bead-set', category: 'necklaces',
    name: 'Krishna Pendant Bead Set',
    summary: 'A gold-plated Krishna pendant on strands of white beads, interrupted by bands of green.',
    description:
      'This is a festive set with a devotional centre. The pendant is framed in white stones, and the bead strands are gathered into gold-plated caps at the sides. The long earrings match the pendant’s frame.',
    finish: 'Gold plated', stoneType: 'MIXED', stoneDetails: 'White stones; white and green bead strands (material to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 64_000,
  },
  {
    sku: 'NKS-011', slug: 'red-green-leaf-necklace', category: 'necklaces',
    name: 'Red and Green Leaf Necklace',
    summary: 'Alternating red and green leaves run along a fine chain to a white flower at the front.',
    description:
      'This piece has the colours of a toran, drawn in a single line. It is light, flat against the skin, and adjustable with a cord tie at the back.',
    stoneType: 'MIXED', stoneDetails: 'Red, green and white stones (to be confirmed)', demoWeightMg: 21_600,
  },
  {
    sku: 'NKS-012', slug: 'turquoise-garden-choker', category: 'necklaces',
    name: 'Turquoise Garden Choker',
    summary: 'A gold-plated choker of enamelled turquoise flowers and textured leaves, with a pink-stone drop.',
    description:
      'The most decorative piece in the collection, built from overlapping flowers and hammered leaves across the whole front. It is worn high on the neck. The earrings are square studs with a single drop.',
    finish: 'Gold plated', stoneType: 'MIXED', stoneDetails: 'Turquoise enamel with pink and white stones (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 57_400,
  },
  {
    sku: 'NKS-013', slug: 'kundan-bead-choker-set', category: 'necklaces',
    name: 'Kundan Bead Choker Set',
    summary: 'A kundan-style centre with a deep red stone, held between many strands of white beads.',
    description:
      'This is the bridal-season piece in the collection. The centre is built from kundan-style stones around a red cabochon with a green drop, and the bead strands sit close at the neck. The earrings are flower studs with a green drop.',
    finish: 'Gold plated', stoneType: 'KUNDAN_GLASS', stoneDetails: 'Kundan-style stones, red and green accents; white bead strands (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 52_000,
  },
  {
    sku: 'NKS-014', slug: 'station-chain-set', category: 'necklaces',
    name: 'Station Chain Set',
    summary: 'A fine chain with small stone flowers spaced along one side and simple stud earrings.',
    description:
      'This is the lightest piece in the collection, made to be worn every day and layered with others. The flowers sit only on the front half of the chain, so the back stays plain under a collar.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia with one blue accent',
    returnNote: EARRING_RETURN, demoWeightMg: 9_800,
  },
  {
    sku: 'NKS-015', slug: 'swirl-bar-necklace-set', category: 'necklaces',
    name: 'Swirl Bar Necklace Set',
    summary: 'Curved silver bars, some set with stones, meet in a swirl at one side with a small drop.',
    description:
      'The bars alternate polished and stone-set sections, so the necklace reads as light and shade. The swirl sits off-centre, which suits an asymmetric neckline. The earrings are angled bars.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia',
    returnNote: EARRING_RETURN, demoWeightMg: 33_500,
  },
  {
    sku: 'NKS-016', slug: 'blue-enamel-twist-set', category: 'necklaces',
    name: 'Blue Enamel Twist Set',
    summary: 'A twisted silver collar with a blue-enamel loop and a pavé disc drop.',
    description:
      'Polished silver, stone-set bands and a single line of deep blue enamel are wound into one loop at the front. The earrings repeat the loop in miniature.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia; blue enamel',
    returnNote: EARRING_RETURN, demoWeightMg: 36_100,
  },
  {
    sku: 'NKS-017', slug: 'star-flower-necklace-set', category: 'necklaces',
    name: 'Star Flower Necklace Set',
    summary: 'Small star-shaped flowers, two with turquoise centres, climb a curving silver stem.',
    description:
      'The stem curves rather than hangs, so the flowers sit at different heights. It is soft and botanical without being sweet. The earrings are a single flower on a short drop.',
    stoneType: 'MIXED', stoneDetails: 'White cubic zirconia with turquoise-coloured centres (to be confirmed)',
    returnNote: EARRING_RETURN, demoWeightMg: 26_400,
  },
  {
    sku: 'NKS-018', slug: 'paisley-flower-necklace-set', category: 'necklaces',
    name: 'Paisley Flower Necklace Set',
    summary: 'A paisley of stone-set loops opens into a flower at one side of a fine chain.',
    description:
      'The motif is placed to one side, where it catches the light as you turn. Linked ovals and a plain chain keep the rest of the piece quiet. The earrings are paisley drops.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia',
    returnNote: EARRING_RETURN, demoWeightMg: 24_900,
  },
  {
    sku: 'NKS-019', slug: 'pear-cluster-drop-earrings', category: 'earrings',
    name: 'Pear Cluster Drop Earrings',
    summary: 'Pear and round stones built into a long, tapering drop.',
    description:
      'They are long enough to be seen with hair worn down and light enough to wear through an evening. The stones are open-backed, so light passes through them.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia, pear and round cuts',
    returnable: false, returnNote: 'For hygiene reasons these earrings can be returned only unworn, with their backs and seal intact.',
    demoWeightMg: 8_400,
  },
  {
    sku: 'MGS-001', slug: 'green-enamel-mangalsutra', category: 'mangalsutras',
    name: 'Green Enamel Mangalsutra',
    summary: 'Black beads on a fine silver chain, with a round pendant of green enamel inside a stone-set frame.',
    description:
      'This is a mangalsutra for daily wear: a fine chain, evenly spaced beads and a pendant small enough to sit under a collar. The matching earrings repeat the green enamel.',
    stoneType: 'CUBIC_ZIRCONIA', stoneDetails: 'White cubic zirconia; green enamel',
    returnNote: EARRING_RETURN, demoWeightMg: 14_200,
  },
  {
    sku: 'PYL-001', slug: 'ghungroo-payal', category: 'payals', featured: true,
    name: 'Ghungroo Payal',
    summary: 'A dense silver chain hung with small ghungroo bells and a flower at the clasp.',
    description:
      'The bells are spaced so they sound when you walk without ringing at every step. The chain is close-linked and flexible, and sits flat on the ankle. Sold as a pair.',
    stoneType: 'MIXED', stoneDetails: 'Small coloured accent stones (to be confirmed)', demoWeightMg: 62_000,
  },
  {
    sku: 'PYL-002', slug: 'rose-leaf-payal', category: 'payals',
    name: 'Rose and Leaf Payal',
    summary: 'A silver payal with pink and green stones set between floral links.',
    description:
      'This payal has colour at the ankle without weight: small pink and green stones alternate with silver flowers along a fine chain. Sold as a pair.',
    stoneType: 'MIXED', stoneDetails: 'Pink and green stones (to be confirmed)', demoWeightMg: 44_500,
  },
  {
    sku: 'PYL-004', slug: 'bell-charm-payal', category: 'payals',
    name: 'Bell Charm Payal',
    summary: 'A rope-textured chain with bell charms and small flower drops.',
    description:
      'A traditional payal in a heavier gauge. The textured chain catches light along its whole length. Sold as a pair.',
    stoneType: 'NONE', demoWeightMg: 70_300,
  },
  {
    sku: 'PYL-005', slug: 'coloured-station-payal', category: 'payals',
    name: 'Coloured Station Payal',
    summary: 'Two-strand payal with stone-set stations in pink and green and a flower clasp.',
    description:
      'The double strand gives the payal body without making it stiff, and the coloured stations are spaced so one always shows at the front. Sold as a pair.',
    stoneType: 'MIXED', stoneDetails: 'Pink, green and white stones (to be confirmed)', demoWeightMg: 58_800,
  },
  {
    sku: 'PYL-006', slug: 'floral-medallion-payal', category: 'payals',
    name: 'Floral Medallion Payal',
    summary: 'A woven silver chain set with small floral medallions and bell drops.',
    description:
      'The medallions are cut with a simple flower and sit flat against the ankle, so the payal stays comfortable under trousers as well as a sari. Sold as a pair.',
    stoneType: 'NONE', demoWeightMg: 66_200,
  },
  {
    sku: 'PYL-007', slug: 'twin-chain-payal', category: 'payals',
    name: 'Twin Chain Payal',
    summary: 'Two parallel chains joined by stone-set bars, with a single pink stone at each end.',
    description:
      'This is the most structured payal in the collection: the bars keep the two chains in line so it sits like a band. Sold as a pair.',
    stoneType: 'MIXED', stoneDetails: 'Green and pink accent stones (to be confirmed)', demoWeightMg: 54_000,
  },
  {
    sku: 'PYL-008', slug: 'flower-clasp-payal', category: 'payals',
    name: 'Flower Clasp Payal',
    summary: 'A close-linked payal with a carved flower at the clasp and small coloured accents.',
    description:
      'This payal is for everyday wear. The flower sits at the side of the ankle where it can be seen, and the chain is a tight, durable weave. Sold as a pair.',
    stoneType: 'MIXED', stoneDetails: 'Small coloured accent stones (to be confirmed)', demoWeightMg: 49_700,
  },
]
