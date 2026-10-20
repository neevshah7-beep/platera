/**
 * The pendant shoot of 2026-10-18 (10 pendants, ProRAW DNG). Added by scripts/add-pendants.ts,
 * never by the seed.
 *
 * Treated as the rings were, at the owner's instruction for that shoot: 925 silver,
 * hallmarked, no HUID; live rate with no making charge; one of each; returns under the
 * standard policy; stones and sizes not described. No weights were given with these photos,
 * so they are left unweighed for the counter to enter in admin.
 */
import type { SeedRing } from './rings'

export const PENDANTS_CATEGORY = {
  slug: 'pendants',
  name: 'Pendants',
  position: 6,
  summary: 'Pendants in hallmarked 925 silver, from devotional pieces to small charms, one of each.',
  seoTitle: 'Silver Pendants for Men and Women | 925 Hallmarked | Platera',
  seoDescription:
    'Silver pendants for men and women in hallmarked 925 silver: trishul, Nataraja, Shri Ram, rudraksha, gada and charm pendants. One of each, bought on WhatsApp.',
  guide: `Every pendant here is 925 sterling silver and BIS hallmarked, and each design is a single piece, so the pendant in the photographs is the one you receive.

Look first at the bail, the loop the chain passes through. It should be soldered closed and wide enough for the chain you mean to wear, so the pendant hangs straight and does not twist.

Devotional pendants are worn close to the skin and every day. Cast pieces like these carry fine detail in the recesses; wipe them with a soft cloth after wearing and store each one in its own pouch, so the raised work keeps its shine and the deep work keeps its shadow.

Pendants are sold without a chain. Ask us on WhatsApp for a silver chain to suit, and for today's price, worked out from the pendant's weight at the day's silver rate.`,
} as const

export const PENDANTS: SeedRing[] = [
  {
    sku: 'PLT-PND-001', slug: 'nataraja-pendant', name: 'Nataraja Pendant', netWeightMg: null, photos: 1,
    summary: 'Shiva as Nataraja, the lord of dance, within a ring of flames on a lotus base.',
    description: 'The figure is cast in full relief, one foot raised, inside the circle of fire, and stands on a stepped lotus pedestal. A substantial devotional pendant with fine detail in every flame.',
  },
  {
    sku: 'PLT-PND-002', slug: 'trishul-damru-pendant', name: 'Trishul and Damru Pendant', netWeightMg: null, photos: 1,
    summary: "Shiva's trishul with the damru drum at its centre, marked with Om.",
    description: 'The three prongs curl outward above a damru carved with Om, and a ribbon of silver falls from the drum. A bold trishul pendant for everyday devotion.',
  },
  {
    sku: 'PLT-PND-003', slug: 'tiger-claw-pendant', name: 'Tiger Claw Pendant', netWeightMg: null, photos: 1,
    summary: 'A curved claw shape, cast entirely in silver, rising from an ornate engraved mount.',
    description: 'The claw is silver throughout, polished smooth to its point, with spiral and floral work in the mount below. A traditional protective form, made without any animal part.',
  },
  {
    sku: 'PLT-PND-004', slug: 'small-trishul-pendant', name: 'Small Trishul Pendant', netWeightMg: null, photos: 1,
    summary: 'A slim trishul with a damru at its waist, light enough for every day.',
    description: 'The finer of the two trishul pendants: the prongs are drawn in clean curves and the shaft ends in a point below the drum. Easy to wear on a fine chain.',
  },
  {
    sku: 'PLT-PND-005', slug: 'shri-ram-pendant', name: 'Shri Ram Pendant', netWeightMg: null, photos: 2,
    summary: 'Shri Ram standing with his bow and quiver, crowned, in full relief.',
    description: 'The figure is detailed from the crown to the folds of the dhoti, with the bow held at his side and the quiver of arrows at his shoulder. A devotional pendant of real presence.',
  },
  {
    sku: 'PLT-PND-006', slug: 'elephant-charm-pendant', name: 'Elephant Charm Pendant', netWeightMg: null, photos: 1,
    summary: 'A small elephant with its trunk raised, a symbol of good fortune, with a wide bail.',
    description: 'The elephant wears a patterned saddle cloth and lifts its trunk, the gesture said to bring luck. The broad bail takes a thicker chain or a cord.',
  },
  {
    sku: 'PLT-PND-007', slug: 'fish-pendant', name: 'Fish Pendant', netWeightMg: null, photos: 1,
    summary: 'A fish with scale-by-scale detail and a flowing, fanned tail.',
    description: 'Every scale is cast in relief and the tail opens in fine ribs. The fish is an old sign of plenty and good luck, and a pendant that suits men and women alike.',
  },
  {
    sku: 'PLT-PND-008', slug: 'hanuman-gada-pendant', name: 'Hanuman Gada Pendant', netWeightMg: null, photos: 1,
    summary: "Hanuman's gada, the mace, with a lotus-patterned head and a lattice-carved handle.",
    description: 'The rounded head is worked in overlapping lotus petals and the handle in a crossed lattice, ending in a turned base. A strong devotional pendant, especially for Tuesdays and Saturdays.',
  },
  {
    sku: 'PLT-PND-009', slug: 'cricket-bat-pendant', name: 'Cricket Bat Pendant', netWeightMg: null, photos: 1,
    summary: 'A miniature cricket bat in polished silver, down to the grip on the handle.',
    description: 'The blade is smooth and bright with a raised spine, and the handle is ringed where the grip would be. A gift for anyone who lives for the game.',
  },
  {
    sku: 'PLT-PND-010', slug: 'rudraksha-pendant', name: 'Rudraksha Pendant', netWeightMg: null, photos: 1,
    summary: 'A natural rudraksha bead set between an engraved silver cap and a silver cup.',
    description: 'The bead is held by a domed, petalled cap above and a fluted cup below, with the bail beneath. Each rudraksha is natural, so its face and markings are its own.',
  },
]
