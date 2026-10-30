"""One-off: men's rings 084-153 into prisma/seed-data/rings.ts; bangles into a new
prisma/seed-data/bangles.ts; scripts/add-bangles.ts from scripts/add-pendants.ts."""
import re
q = lambda x: x.replace("'", "\\'")

def rows(path):
    return [l.rstrip('\n').split('|') for l in open(path, encoding='utf8') if l.strip()]

def entries(rs, prefix):
    out = ''
    for n, slug, name, s, d in rs:
        out += (f"  {{\n    sku: '{prefix}-{n}', slug: '{slug}', name: '{q(name)}', netWeightMg: null, photos: 0,\n"
                f"    summary: '{q(s)}',\n    description: '{q(d)}',\n  }},\n")
    return out

mens = rows('scripts/data/new-mens-oct30.txt'); assert len(mens) == 70
for r in mens:
    r[2] = r[2].replace('Ruby Red Dome Ring', 'Red Dome Ring'); r[1] = r[1].replace('ruby-red-dome-ring', 'red-dome-ring')
p = 'prisma/seed-data/rings.ts'
s = open(p, encoding='utf8').read()
assert 'PLT-RNG-084' not in s
i = s.rstrip().rfind(']')
s = s[:i] + "  // 2026-10-30: the men's ring shoot (studio photographs), 084-153.\n" + entries(mens, 'PLT-RNG') + s[i:]
s = s.replace("  seoTitle: 'Silver Rings for Women | 925 Hallmarked | Platera',", "  seoTitle: 'Silver Rings for Men and Women | 925 Hallmarked | Platera',")
s = s.replace("'Silver rings for women in hallmarked 925 silver: hearts, solitaire styles, bands and statement rings. One of each, bought on WhatsApp from Borivali West, Mumbai.'",
              "'Silver rings for men and women in hallmarked 925 silver: signets, devotional rings, solitaires, hearts, bands and statement rings. One of each, bought on WhatsApp from Borivali West, Mumbai.'")
open(p, 'w', encoding='utf8').write(s)

bang = rows('scripts/data/new-bangles-oct30.txt'); assert len(bang) == 26
open('prisma/seed-data/bangles.ts', 'w', encoding='utf8').write("""/**
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
""" + entries(bang, 'PLT-BNG') + "]\n")

a = open('scripts/add-pendants.ts', encoding='utf8').read()
b = a.replace('pendants', 'bangles').replace('Pendants', 'Bangles').replace('PENDANTS', 'BANGLES').replace('pendant', 'bangle').replace('Pendant', 'Bangle')
open('scripts/add-bangles.ts', 'w', encoding='utf8').write(b)
print('ok', len(mens), len(bang))
