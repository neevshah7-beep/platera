/**
 * The ring shoot of 2026-10-17 (21 rings), two rings shot on 2026-10-16 (022, 023), and
 * rings 024-083 from the AI studio photographs of 2026-10-23.
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
  {
    sku: 'PLT-RNG-022', slug: 'cushion-halo-ring', name: 'Cushion Halo Ring', netWeightMg: 3_420, photos: 3,
    summary: 'A large round centre in a double cushion halo, with a smaller halo cluster on either shoulder.',
    description: 'Two rows of sparkle frame the centre and the shoulders carry their own small halos, so the ring catches light from every angle. A statement ring for occasions.',
  },
  {
    sku: 'PLT-RNG-023', slug: 'scarlet-halo-ring', name: 'Scarlet Halo Ring', netWeightMg: 3_650, photos: 3,
    summary: 'An oval scarlet centre inside a starburst of sparkling points and tapered bars.',
    description: 'The deep red centre is ringed by a fine halo and then a burst of pointed and baguette-shaped sparkle, on an open split band. A cocktail ring with real colour.',
  },
  // 2026-10-23: rings known so far only from the AI studio photographs.
  {
    sku: 'PLT-RNG-024', slug: 'heart-cutout-band', name: 'Heart Cutout Band', netWeightMg: null, photos: 0,
    summary: 'A broad band with a row of hearts cut into its face.',
    description: 'The cut hearts are polished at the edges and darkened inside, so the pattern shows clearly against the bright silver. A band to wear on its own or as the anchor of a stack.',
  },
  {
    sku: 'PLT-RNG-025', slug: 'circle-pattern-band', name: 'Circle Pattern Band', netWeightMg: null, photos: 0,
    summary: 'A wide, flat band marked all the way round with a line of circles.',
    description: 'A simple, graphic band with a soft brushed face between the polished circles. It sits comfortably for everyday wear.',
  },
  {
    sku: 'PLT-RNG-026', slug: 'emerald-cut-halo-ring', name: 'Emerald-Cut Halo Ring', netWeightMg: null, photos: 0,
    summary: 'A tall, step-cut rectangular centre framed by a bright halo, with patterned shoulders.',
    description: 'The long rectangular centre is set high in a fine halo, and the shoulders open into a sparkling lattice. A statement ring for occasions.',
  },
  {
    sku: 'PLT-RNG-027', slug: 'round-loop-solitaire-ring', name: 'Round Loop Solitaire Ring', netWeightMg: null, photos: 0,
    summary: 'A round solitaire held in four claws, with the band looping open on either side.',
    description: 'The band splits into two curves that wrap the centre, giving a simple solitaire a lighter, more modern line.',
  },
  {
    sku: 'PLT-RNG-028', slug: 'open-loop-solitaire-ring', name: 'Open Loop Solitaire Ring', netWeightMg: null, photos: 0,
    summary: 'A round centre set between two open silver loops that sweep around it.',
    description: 'The plain, polished loops curl like ribbons on each side of the centre. Elegant and easy to wear every day.',
  },
  {
    sku: 'PLT-RNG-029', slug: 'pave-wave-ring', name: 'Pave Wave Ring', netWeightMg: null, photos: 0,
    summary: 'A raised wave of silver over a sparkling pave band.',
    description: 'One polished curve rises over the band like a cresting wave, with a line of sparkle running beneath it. A modern, sculptural ring.',
  },
  {
    sku: 'PLT-RNG-030', slug: 'two-tone-leaf-loop-ring', name: 'Two-Tone Leaf Loop Ring', netWeightMg: null, photos: 0,
    summary: 'Interlaced loops and a sparkling leaf, with a warm two-tone finish.',
    description: 'The loops cross over one another in polished silver and a soft rose tone, ending in a small pave leaf. A ring with movement in its design.',
  },
  {
    sku: 'PLT-RNG-031', slug: 'baguette-scroll-ring', name: 'Baguette Scroll Ring', netWeightMg: null, photos: 0,
    summary: 'A straight baguette centre with a silver scroll curling around it.',
    description: 'A curl of silver and a trail of small sparkle wind around one clean bar, balancing straight lines with soft curves.',
  },
  {
    sku: 'PLT-RNG-032', slug: 'silver-crown-ring', name: 'Silver Crown Ring', netWeightMg: null, photos: 0,
    summary: 'A crown of scrolls and fleur points rising above a sparkling base row.',
    description: 'The crown is worked with open scrolls and small points along the top, over a band lined with sparkle. A playful statement ring.',
  },
  {
    sku: 'PLT-RNG-033', slug: 'pink-butterfly-ring', name: 'Pink Butterfly Ring', netWeightMg: null, photos: 0,
    summary: 'A large oval pink centre with small silver butterflies resting on its edges.',
    description: 'The soft pink centre is held in a fine frame, and two butterflies sit on its sides as if they have just landed. A colourful cocktail ring.',
  },
  {
    sku: 'PLT-RNG-034', slug: 'green-butterfly-ring', name: 'Green Butterfly Ring', netWeightMg: null, photos: 0,
    summary: 'A large oval green centre with silver butterflies perched at its sides.',
    description: 'The deep sea-green centre catches light across its facets, and the small butterflies give it a light, garden feel. A ring with real colour.',
  },
  {
    sku: 'PLT-RNG-035', slug: 'framed-rectangle-ring', name: 'Framed Rectangle Ring', netWeightMg: null, photos: 0,
    summary: 'A rectangular centre set inside a broad, polished silver frame.',
    description: 'A clean, architectural ring: the wide frame gives the centre weight and presence on the finger.',
  },
  {
    sku: 'PLT-RNG-036', slug: 'oval-leaf-cluster-ring', name: 'Oval Leaf Cluster Ring', netWeightMg: null, photos: 0,
    summary: 'An oval centre flanked by two sparkling leaves, held in open silver loops.',
    description: 'The leaves fan out on either side of the oval, and the open loops keep the top light and airy.',
  },
  {
    sku: 'PLT-RNG-037', slug: 'orbit-solitaire-ring', name: 'Orbit Solitaire Ring', netWeightMg: null, photos: 0,
    summary: 'A round centre held inside crossing circles of silver and sparkle.',
    description: 'One circle is plain and one is lined with sparkle; they cross around the centre like orbits. A modern take on the solitaire.',
  },
  {
    sku: 'PLT-RNG-038', slug: 'yellow-statement-ring', name: 'Yellow Statement Ring', netWeightMg: null, photos: 0,
    summary: 'A large square yellow centre framed by tapered sparkle and a gold-tone setting.',
    description: 'The bright yellow centre is set in a warm gold-tone frame, with tapering sparkle on the shoulders. A bold cocktail ring.',
  },
  {
    sku: 'PLT-RNG-039', slug: 'crowned-heart-ring', name: 'Crowned Heart Ring', netWeightMg: null, photos: 0,
    summary: 'A small open heart topped with a little sparkling crown.',
    description: 'A delicate ring: the heart is drawn in a single fine line of silver, finished at the top with a cluster of sparkle.',
  },
  {
    sku: 'PLT-RNG-040', slug: 'red-blossom-ring', name: 'Red Blossom Ring', netWeightMg: null, photos: 0,
    summary: 'A tall rectangular red centre with small blue blossoms at its corner.',
    description: 'The deep red centre stands on a sparkling band, and a little cluster of blue flowers sits on its edge. A ring for festive wear.',
  },
  {
    sku: 'PLT-RNG-041', slug: 'leaf-heart-swirl-ring', name: 'Leaf Heart Swirl Ring', netWeightMg: null, photos: 0,
    summary: 'A polished leaf and a sparkling heart curl together on an open band.',
    description: 'The two shapes wrap around each other in one flowing line of silver, open at the back for an easy fit.',
  },
  {
    sku: 'PLT-RNG-042', slug: 'marquise-trilogy-ring', name: 'Marquise Trilogy Ring', netWeightMg: null, photos: 0,
    summary: 'A marquise centre between two round sparkling side settings.',
    description: 'Three settings in a row, the long marquise at the centre, give a classic trilogy look on a slim band.',
  },
  {
    sku: 'PLT-RNG-043', slug: 'v-chevron-ring', name: 'V Chevron Ring', netWeightMg: null, photos: 0,
    summary: 'A fine wishbone V band lined with tiny sparkle.',
    description: 'A slim, pointed band that frames the finger and stacks neatly with other rings. Light and minimal.',
  },
  {
    sku: 'PLT-RNG-044', slug: 'sparkle-wreath-ring', name: 'Sparkle Wreath Ring', netWeightMg: null, photos: 0,
    summary: 'An open circle of sparkling settings worn like a wreath on the finger.',
    description: 'The round wreath sits flat on the band with a pear-shaped accent at one side. Graceful and eye-catching.',
  },
  {
    sku: 'PLT-RNG-045', slug: 'pear-tiara-ring', name: 'Pear Tiara Ring', netWeightMg: null, photos: 0,
    summary: 'A pear-shaped centre rising from a tiara of sparkling points.',
    description: 'The pear sits upright above a fan of small sparkle, like the top of a tiara, on a slim polished band.',
  },
  {
    sku: 'PLT-RNG-046', slug: 'heart-sided-halo-ring', name: 'Heart-Sided Halo Ring', netWeightMg: null, photos: 0,
    summary: 'A round halo with open silver hearts on either side.',
    description: 'The bright round centre is framed by sparkle, and two open hearts curve out from its sides. A romantic ring.',
  },
  {
    sku: 'PLT-RNG-047', slug: 'petite-oval-halo-ring', name: 'Petite Oval Halo Ring', netWeightMg: null, photos: 0,
    summary: 'A small oval centre in a sparkling halo on a slim band.',
    description: 'A dainty ring with a fine halo around the oval centre. Pretty for everyday wear.',
  },
  {
    sku: 'PLT-RNG-048', slug: 'square-swirl-ring', name: 'Square Swirl Ring', netWeightMg: null, photos: 0,
    summary: 'A square centre set on its point inside sweeping curves of silver and sparkle.',
    description: 'The curves of the band swirl around the square, one polished and one lined with sparkle.',
  },
  {
    sku: 'PLT-RNG-049', slug: 'pear-scroll-ring', name: 'Pear Scroll Ring', netWeightMg: null, photos: 0,
    summary: 'A pear-shaped centre resting on curling silver scrolls.',
    description: 'The scrolls curve out beneath the pear like petals, and the band carries a line of sparkle on each shoulder.',
  },
  {
    sku: 'PLT-RNG-050', slug: 'blossom-crossover-ring', name: 'Blossom Crossover Ring', netWeightMg: null, photos: 0,
    summary: 'Two small blossoms of sparkle on an open, crossing band.',
    description: 'The band crosses over itself with a little flower at each end. A light, cheerful ring.',
  },
  {
    sku: 'PLT-RNG-051', slug: 'double-row-band', name: 'Double Row Band', netWeightMg: null, photos: 0,
    summary: 'A band of two rows: one polished silver, one of fine sparkle.',
    description: 'A simple, refined band with a row of sparkle beneath a plain polished edge. It works well alone or stacked.',
  },
  {
    sku: 'PLT-RNG-052', slug: 'petal-halo-ring', name: 'Petal Halo Ring', netWeightMg: null, photos: 0,
    summary: 'A large round centre in a halo of petal-shaped sparkle.',
    description: 'The bold round centre is surrounded by sparkling petals, and the band is set with sparkle on each side. A statement ring.',
  },
  {
    sku: 'PLT-RNG-053', slug: 'dragonfly-ring', name: 'Dragonfly Ring', netWeightMg: null, photos: 0,
    summary: 'A silver dragonfly with open wings and a sparkling body.',
    description: 'The wings are open filigree outlines, and the body is set with small sparkle. A playful ring that sits across the finger.',
  },
  {
    sku: 'PLT-RNG-054', slug: 'marquise-split-shank-ring', name: 'Marquise Split Shank Ring', netWeightMg: null, photos: 0,
    summary: 'A marquise centre set upright between the split arms of the band.',
    description: 'The arms of the band divide around the long marquise and are tied with small silver knots on each side.',
  },
  {
    sku: 'PLT-RNG-055', slug: 'pave-lens-band', name: 'Pave Lens Band', netWeightMg: null, photos: 0,
    summary: 'A wide band with a lens-shaped panel of sparkle across the front.',
    description: 'The sparkle panel tapers to points at each side, set within polished silver edges. Bold but easy to wear.',
  },
  {
    sku: 'PLT-RNG-056', slug: 'silver-snake-ring', name: 'Silver Snake Ring', netWeightMg: null, photos: 0,
    summary: 'A coiled silver snake with a sparkling body and a small green eye.',
    description: 'The snake wraps around the finger with its tail trailing out along the band. A striking ring with character.',
  },
  {
    sku: 'PLT-RNG-057', slug: 'pear-halo-pave-ring', name: 'Pear Halo Pave Ring', netWeightMg: null, photos: 0,
    summary: 'A pear-shaped centre in a halo, on a band lined with sparkle.',
    description: 'A classic pear halo with a warm finish and a sparkling band all the way to the shoulders. An elegant occasion ring.',
  },
  {
    sku: 'PLT-RNG-058', slug: 'butterfly-ring', name: 'Butterfly Ring', netWeightMg: null, photos: 0,
    summary: 'A silver butterfly with sparkling wings, set across the band.',
    description: 'The wings are outlined in polished silver and filled with small sparkle. A pretty, playful ring.',
  },
  {
    sku: 'PLT-RNG-059', slug: 'double-chevron-ring', name: 'Double Chevron Ring', netWeightMg: null, photos: 0,
    summary: 'Two V-shaped bands, one polished and one sparkling, joined as one ring.',
    description: 'The chevrons point to the centre of the finger and nest neatly together, giving the look of a stacked pair in one ring.',
  },
  {
    sku: 'PLT-RNG-060', slug: 'two-tone-sparkle-band', name: 'Two-Tone Sparkle Band', netWeightMg: null, photos: 0,
    summary: 'A broad band in a warm two-tone finish, with flowing lines of sparkle.',
    description: 'Polished curves and rows of sparkle flow across the front of the band. A rich, festive ring.',
  },
  {
    sku: 'PLT-RNG-061', slug: 'vine-blossom-ring', name: 'Vine Blossom Ring', netWeightMg: null, photos: 0,
    summary: 'A slim open band with two little blossoms on a curling vine.',
    description: 'The vine curls across the finger with a flower of sparkle at its end. Light, delicate and easy to wear.',
  },
  {
    sku: 'PLT-RNG-062', slug: 'blue-pear-halo-ring', name: 'Blue Pear Halo Ring', netWeightMg: null, photos: 0,
    summary: 'A deep blue pear-shaped centre in a starburst halo of sparkle.',
    description: 'The blue pear is surrounded by pointed and round sparkle in a bright burst. A cocktail ring with rich colour.',
  },
  {
    sku: 'PLT-RNG-063', slug: 'sunflower-ring', name: 'Sunflower Ring', netWeightMg: null, photos: 0,
    summary: 'A large sunflower of sparkle with a radiating centre.',
    description: 'Petal-shaped settings fan out around a round centre carved like a sunflower. A bold, joyful statement ring.',
  },
  {
    sku: 'PLT-RNG-064', slug: 'heart-wreath-ring', name: 'Heart Wreath Ring', netWeightMg: null, photos: 0,
    summary: 'An open heart drawn in a ring of sparkling settings.',
    description: 'The heart is outlined entirely in sparkle and open at its centre, set across a slim polished band.',
  },
  {
    sku: 'PLT-RNG-065', slug: 'camellia-ring', name: 'Camellia Ring', netWeightMg: null, photos: 0,
    summary: 'A full silver camellia flower with layered pave petals.',
    description: 'The petals overlap in layers, each set with fine sparkle, around a bright centre. A flower ring with depth.',
  },
  {
    sku: 'PLT-RNG-066', slug: 'pave-heart-crossover-ring', name: 'Pave Heart Crossover Ring', netWeightMg: null, photos: 0,
    summary: 'A sparkling heart framed by sweeping crossover curves.',
    description: 'The band crosses over the front of the finger, wrapping a heart filled with sparkle. Romantic and modern.',
  },
  {
    sku: 'PLT-RNG-067', slug: 'sweetheart-note-ring', name: 'Sweetheart Note Ring', netWeightMg: null, photos: 0,
    summary: 'A small heart with a curling silver flourish on a fine band.',
    description: 'A delicate ring: a little heart and a playful curl of silver sit on a slim band lined with tiny sparkle.',
  },
  {
    sku: 'PLT-RNG-068', slug: 'pave-swirl-ring', name: 'Pave Swirl Ring', netWeightMg: null, photos: 0,
    summary: 'A broad swirl of silver and sparkle wrapping around the finger.',
    description: 'Polished and sparkling curves spiral together in a sculptural top. A ring with movement.',
  },
  {
    sku: 'PLT-RNG-069', slug: 'puffy-heart-ring', name: 'Puffy Heart Ring', netWeightMg: null, photos: 0,
    summary: 'A rounded, polished heart with a curve of sparkle on one side.',
    description: 'The heart is shaped full and smooth, with sparkle trailing along its edge onto the band.',
  },
  {
    sku: 'PLT-RNG-070', slug: 'loop-curl-ring', name: 'Loop Curl Ring', netWeightMg: null, photos: 0,
    summary: 'An open band ending in a loop and a small round curl.',
    description: 'A minimal, open ring with a simple loop at the front. Light enough for every day.',
  },
  {
    sku: 'PLT-RNG-071', slug: 'trilogy-sparkle-band', name: 'Trilogy Sparkle Band', netWeightMg: null, photos: 0,
    summary: 'Three round settings across a slim curved band.',
    description: 'A row of three sparkling centres nestles into the curve of the band. A classic, versatile ring.',
  },
  {
    sku: 'PLT-RNG-072', slug: 'princess-petal-ring', name: 'Princess Petal Ring', netWeightMg: null, photos: 0,
    summary: 'A square centre framed by four petals of sparkle.',
    description: 'The petals open around the square like a flower, on a band set with small sparkle.',
  },
  {
    sku: 'PLT-RNG-073', slug: 'petite-solitaire-band', name: 'Petite Solitaire Band', netWeightMg: null, photos: 0,
    summary: 'A small round centre on a band lined with sparkle.',
    description: 'A dainty solitaire with sparkle running along the band on each side. Simple and graceful.',
  },
  {
    sku: 'PLT-RNG-074', slug: 'flower-prong-solitaire-ring', name: 'Flower Prong Solitaire Ring', netWeightMg: null, photos: 0,
    summary: 'A round centre held in flower-shaped claws, on a sparkling band.',
    description: 'The claws open like petals around the centre, and the band is lined with sparkle to the shoulders.',
  },
  {
    sku: 'PLT-RNG-075', slug: 'star-ring', name: 'Star Ring', netWeightMg: null, photos: 0,
    summary: 'A sparkling star set on a slim polished band.',
    description: 'A small star filled with sparkle at the front of a plain band. Playful and easy to wear.',
  },
  {
    sku: 'PLT-RNG-076', slug: 'heart-halo-round-ring', name: 'Heart Halo Round Ring', netWeightMg: null, photos: 0,
    summary: 'A round centre framed by an open heart of sparkle.',
    description: 'The heart outline wraps the round centre, with polished silver accents at each side.',
  },
  {
    sku: 'PLT-RNG-077', slug: 'six-claw-solitaire-ring', name: 'Six-Claw Solitaire Ring', netWeightMg: null, photos: 0,
    summary: 'A large round solitaire held high in six claws.',
    description: 'A classic solitaire on a plain polished band, the centre raised to catch the light.',
  },
  {
    sku: 'PLT-RNG-078', slug: 'leaf-heart-ring', name: 'Leaf Heart Ring', netWeightMg: null, photos: 0,
    summary: 'A heart made of a polished silver leaf beside a sparkling half.',
    description: 'One half of the heart is carved like a leaf, the other set with sparkle. A charming everyday ring.',
  },
  {
    sku: 'PLT-RNG-079', slug: 'trefoil-ring', name: 'Trefoil Ring', netWeightMg: null, photos: 0,
    summary: 'Three sparkling loops arranged like a trefoil.',
    description: 'The loops are outlined in silver and filled with fine sparkle, set upright across the band.',
  },
  {
    sku: 'PLT-RNG-080', slug: 'open-heart-scroll-ring', name: 'Open Heart Scroll Ring', netWeightMg: null, photos: 0,
    summary: 'A large open heart with a scroll curling inside it.',
    description: 'The heart is drawn in polished silver and fine sparkle, with a scroll at its centre. Romantic and airy.',
  },
  {
    sku: 'PLT-RNG-081', slug: 'heart-swirl-ring', name: 'Heart Swirl Ring', netWeightMg: null, photos: 0,
    summary: 'A heart formed from swirling bands of silver and sparkle.',
    description: 'The swirls overlap to form a heart, with sparkle set into the curves.',
  },
  {
    sku: 'PLT-RNG-082', slug: 'puzzle-heart-ring', name: 'Puzzle Heart Ring', netWeightMg: null, photos: 0,
    summary: 'A small heart of polished and sparkling pieces fitted together.',
    description: 'A dainty heart at the centre of a slim band, made of two halves that lock like puzzle pieces.',
  },
  {
    sku: 'PLT-RNG-083', slug: 'kite-ring', name: 'Kite Ring', netWeightMg: null, photos: 0,
    summary: 'A kite-shaped frame with a sparkling centre on a split band.',
    description: 'The band opens into a diamond-shaped frame at the front, set with a small sparkle at its centre.',
  },
]
