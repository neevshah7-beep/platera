"""One-off: appends rings 024-083 (scripts/data/new-rings-oct23.txt) to prisma/seed-data/rings.ts."""
rows = [l.rstrip('\n').split('|') for l in open('scripts/data/new-rings-oct23.txt', encoding='utf8') if l.strip()]
assert len(rows) == 60
q = lambda x: x.replace("'", "\\'")
out = ''
for n, slug, name, s, d in rows:
    out += (f"  {{\n    sku: 'PLT-RNG-{n}', slug: '{slug}', name: '{q(name)}', netWeightMg: null, photos: 0,\n"
            f"    summary: '{q(s)}',\n    description: '{q(d)}',\n  }},\n")
p = 'prisma/seed-data/rings.ts'
src = open(p, encoding='utf8').read()
assert 'PLT-RNG-024' not in src
i = src.rstrip().rfind(']')
src = src[:i] + "  // 2026-10-23: rings known so far only from the AI studio photographs.\n" + out + src[i:]
src = src.replace(' * The ring shoot of 2026-10-17 (21 rings), and two rings shot on 2026-10-16 (022, 023).',
                  ' * The ring shoot of 2026-10-17 (21 rings), two rings shot on 2026-10-16 (022, 023), and\n'
                  ' * rings 024-083 from the AI studio photographs of 2026-10-23.')
open(p, 'w', encoding='utf8').write(src)
print('ok')
