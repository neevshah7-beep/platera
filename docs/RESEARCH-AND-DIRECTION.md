# Platera — research, then direction

Research done 2026-10-05, before any new code. Sources: Awwwards jewellery Site-of-the-Day winners
(Indigo Laboratory 2026, Floema, ORE, Extremely Piaget, Rouvenat, Araw), Cartier Watches & Wonders
2026 (Immersive Garden, SOTD), the 2026 Three.js showcases (Oryzo, IVRESS, Shopify Editions,
Primland), GRAIR (jewellery in Three.js + Blender), Apple's scroll-sequence product pages, and
write-ups on what makes motion feel expensive.

## What the best sites actually do

1. **One hard idea per scene, given a whole room.** Cartier: six alcoves, one watch each, and
   scroll moves *between rooms*, not down a page. "One room per item beats one long scroll."
2. **Scroll is the camera rig, and scenes are pinned beats:** entrance → hold → exit (Apple,
   Shopify Editions). Each pinned scene makes one point, then releases to the next.
3. **Atmosphere is the material.** GRAIR and Cartier lean on lighting, mirrored surfaces,
   drifting horizons and composition, not geometry density. The object is lit like a photograph.
4. **Photoreal where it matters comes from offline rendering.** Apple and Oryzo render the
   hero object in a full renderer and scrub the frames with scroll (canvas image sequences),
   then layer live WebGL on top: light, particles, distortion, transitions. Nothing real-time in
   a browser matches Cycles for gold and diamonds, and the sites that look "perfect" do not try to.
5. **Sound is narrative,** not wallpaper (Indigo, Cartier), behind an elegant entry gate
   ("Enter the experience"), which also lets the experience preload.
6. **Hidden interactions reward curiosity** (Cartier): people stay and explore.
7. **What reads as expensive:** inertial scroll; line-split type reveals with composed delays;
   clip-path reveals with a bright edge; parallax kept under ~15%; magnetic effects on one or two
   anchors only. **What reads as cheap:** plain fades, obvious parallax, motion everywhere, and
   motion that reacts rather than composes.

## Direction for Platera (Champagne Gold, chosen by the client)

- **Light:** sunlit champagne gold. Backgrounds run from champagne #E8D3A6 to honey #C9A05A,
  with espresso #2B1D0E type and polished yellow gold with pearl-white highlights. Warm, bright,
  festive: a jewellery counter in late-afternoon sun, never dark.
- **Hybrid rendering.** Every hero moment is rendered in Blender Cycles (real gold, real
  refraction, real caustics) as a scroll-scrubbed frame sequence, composited in one WebGL canvas
  with live layers: lens and light, shader transitions between scenes, dust and sparkle that
  follow the cursor, depth parallax. It is photoreal, and it is still alive under the pointer.
- **Pinned scenes,** each with one idea, flowing into the next through a shader transition (a
  sweep of light, a ripple of silk), never a cut.
- **Typography:** Gambetta display set large, with line-split reveals; Satoshi for text;
  tabular numerals for every price, weight and rate.

## The homepage, scene by scene (the client's storyboard)

| # | Scene | What happens as you scroll | Message |
|---|-------|----------------------------|---------|
| 0 | **Entry** | A champagne-silk field. Light moves across it under the cursor. "Enter Platera" (sound on). | Invitation |
| 1 | **The fall** | A ring falls through warm light in slow motion, turns once, lands on silk with a soft settle; the silk ripples and the stone throws a flash. PLATERA rises behind it. | The house |
| 2 | **The strand** | A necklace of gold beads draws across the screen. Each bead swings forward in turn and opens into a fact: hallmarked 925 · weighed in the open · today's rate · made to order in 15–20 days · 7-day returns · insured delivery. | The promises |
| 3 | **The stamp** | Macro on a silver bar. The hallmarking punch strikes, a spark, and BIS · 925 is in the metal. | Trust |
| 4 | **The collection** | Real pieces on golden silk, each catching the light in turn as the camera glides past; hover lifts one. | The pieces |
| 5 | **The gift** | The box lid closes, champagne paper folds around it crease by crease, the ribbon wraps and ties into a bow, the Platera tag drops on. | The gift |
| 6 | **The visit** | Gorai 1: store hours, book a viewing, WhatsApp. | The people |

Every scene must pass before it is shown: it is photoreal, it is alive under the pointer, it
flows into the next scene, and it is aesthetic before it is impressive.

## Scene bank: every scene born from jewellery, each with its own animation and interaction

No two scenes share a motion idea or an interaction. Each is rendered in Blender (photoreal)
and/or built live in WebGL, and each answers the pointer or touch in its own way.

### Homepage
| Scene | Animation (scroll) | Interaction (unique) |
|---|---|---|
| **The fall**: ring onto champagne silk | slow-motion fall, landing ripple, light sweep across the stone | the pointer is a hand-held lamp: its light travels across the silk and over the gold; press to make the diamond flash |
| **The strand**: gold beads | the strand draws across; each bead swings forward in turn and opens into a promise | drag the strand and it sways on real pendulum physics; hover a bead to turn it and read the engraving |
| **Molten gold**: the craft | gold pours from a crucible into a mould, cools from orange to gold, and PLATERA is cast | the pointer stirs the heat shimmer; the poured metal follows a scroll-scrubbed fluid render |
| **The stamp**: the hallmark | macro on a silver bar | press and hold to raise the punch, release to strike: a spark, a dent, BIS · 925 in the metal |
| **Polish**: the finish | a cloth passes over tarnished silver | scrub with the pointer to polish: the shine is revealed wherever you wipe |
| **The collection**: pieces on golden silk | camera glides along the silk; each piece catches the light in turn | hover lifts a piece toward you; the cursor's light rakes across its surface (normal maps) |
| **The gift**: wrapping | lid closes, paper folds crease by crease, ribbon wraps, bow ties, tag drops | pull the ribbon's tail to untie it again; the box answers with a soft rattle |
| **The visit**: Gorai 1 at dusk | the shopfront lamps come on one by one | hover a window to look inside; book or WhatsApp |

### Collection rooms (one signature each)
- **Payals**: ghungroo bells that chime (Web Audio) and swing as the pointer passes, on chained pendulum physics.
- **Earrings**: jhumkas that swing with the pointer's velocity and settle back.
- **Necklaces**: the chain drapes over a velvet bust and slides with the pointer (verlet chain); necklace lengths are measured with a tape.
- **Mangalsutras (bridal)**: marigold petals drift in volumetric light; black beads thread themselves onto gold as you scroll; garnet light.

### Piece page
- **The loupe**: drag a jeweller's loupe over the piece and see real optical magnification and fringe.
- **The lamp**: move the lamp; the highlights travel across the metal (the piece's normal map).
- **The scale**: the piece is set on a balance, and the weight and price count up into the ledger.
- **Light moods**: daylight, diya, evening, mandap relight the piece.
- **Ring sizer**: a gauge turns as the size changes.

### Craft and story pages
- **Filigree**: gold wire draws itself into a pattern, then lifts into 3D.
- **Stone setting**: claws close over a stone one by one.
- **Gold rate**: today's rate set in molten digits that cool and set.
- **Diamond light**: rainbow fire from a stone follows the pointer across the page.
