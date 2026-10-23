// The AI studio images of each ring (assets/raw/oct23, sorted in scripts/oct23_rings.py),
// for the piece page's "In the studio" gallery. Kept apart from the original store
// photographs, which are shown as taken. Writes public/media/studio/<SKU>-sNN-{800,1600}.webp
// and src/data/studio.json { "PLT-RNG-001": ["PLT-RNG-001-s01", ...] }.
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
const rings = JSON.parse(execFileSync('python', ['-c', 'import sys,json; sys.path.insert(0,"scripts"); from oct23_rings import RINGS, FOLDERS; print(json.dumps({"rings": RINGS, "folders": FOLDERS}))'], { encoding: 'utf8' }))
const files = Object.fromEntries(Object.entries(rings.folders).map(([k, v]) => [k, readdirSync(`assets/raw/oct23/${v}`).sort().map((f) => `assets/raw/oct23/${v}/${f}`)]))
mkdirSync('public/media/studio', { recursive: true })
const out = {}
for (const [sku, photos] of Object.entries(rings.rings)) {
  out[sku] = []
  for (const [n, [k, i]] of photos.entries()) {
    const name = `${sku}-s${String(n + 1).padStart(2, '0')}`
    for (const w of [800, 1600]) await sharp(files[k][i]).rotate().resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/media/studio/${name}-${w}.webp`)
    out[sku].push(name)
  }
}
writeFileSync('src/data/studio.json', JSON.stringify(out, null, 1))
console.log(Object.keys(out).length, 'rings,', Object.values(out).flat().length, 'studio images')
