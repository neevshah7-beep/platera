p='src/site/Viewing.tsx'; s=open(p,encoding='utf8').read()
a="studio?: string[]; productId?: string; start?: number }"
assert a in s; s=s.replace(a,"studio?: string[]; productId?: string; start?: number; plain?: boolean }",1)
a="    { src: `${piece.cutout}-1600.webp`, thumb: `${piece.cutout}-960.webp`, label: 'The piece, on its own' },\n  ]"
assert a in s
s=s.replace(a,"    // Pieces shown in their photographs (photo-pieces.ts) have no cut-out: their main image\n    // is a crop of a photograph already in the list.\n    ...(piece.plain ? [] : [{ src: `${piece.cutout}-1600.webp`, thumb: `${piece.cutout}-960.webp`, label: 'The piece, on its own' }]),\n  ]")
open(p,'w',encoding='utf8').write(s)
p='src/components/pdp/Originals.tsx'; s=open(p,encoding='utf8').read()
a="? [...studio.map((p, k) => ({ src: `${p}-1600.webp`, label: 'Studio image', cutout: false, at: k })), ...(piece.photos.length ? [] : [cutout])]\n      : [...piece.photos.map((p, k) => ({ src: `${p}-1600.webp`, label: 'As photographed at the counter', cutout: false, at: studio.length + k })), cutout]"
assert a in s
s=s.replace(a,"? [...studio.map((p, k) => ({ src: `${p}-1600.webp`, label: 'Studio image', cutout: false, at: k })), ...(piece.photos.length || piece.plain ? [] : [cutout])]\n      : [...piece.photos.map((p, k) => ({ src: `${p}-1600.webp`, label: 'As photographed at the counter', cutout: false, at: studio.length + k })), ...(piece.plain ? [] : [cutout])]")
open(p,'w',encoding='utf8').write(s); print('ok')
