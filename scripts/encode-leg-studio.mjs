// The leg ring photographs (2026-11-10; grouped in scripts/data/leg.json by
// scripts/make_leg_frames.py) into the piece galleries: public/media/studio/<SKU>-sNN-{800,1600}.webp,
// merged into src/data/studio.json.
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const src = 'assets/raw/nov10'
const leg = JSON.parse(readFileSync('scripts/data/leg.json', 'utf8'))
const studio = JSON.parse(readFileSync('src/data/studio.json', 'utf8'))
for (const [sku, files] of Object.entries(leg)) {
  studio[sku] = []
  for (const [n, f] of files.entries()) {
    const name = `${sku}-s${String(n + 1).padStart(2, '0')}`
    for (const w of [800, 1600]) await sharp(`${src}/${f}`).rotate().resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/media/studio/${name}-${w}.webp`)
    studio[sku].push(name)
  }
}
writeFileSync('src/data/studio.json', JSON.stringify(studio, null, 1))
console.log(Object.keys(leg).length, 'leg ring designs,', Object.values(leg).flat().length, 'photographs')
