// The men's ring studio photographs (2026-10-28; grouped in scripts/data/mens.json by
// scripts/make_frames.py) into the studio galleries: public/media/studio/<SKU>-sNN-{800,1600}.webp,
// merged into src/data/studio.json.
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const src = 'assets/raw/oct30/mens-rings/Mens ring'
const mens = JSON.parse(readFileSync('scripts/data/mens.json', 'utf8'))
const studio = JSON.parse(readFileSync('src/data/studio.json', 'utf8'))
for (const [sku, files] of Object.entries(mens)) {
  studio[sku] = []
  for (const [n, f] of files.entries()) {
    const name = `${sku}-s${String(n + 1).padStart(2, '0')}`
    for (const w of [800, 1600]) await sharp(`${src}/${f}`).rotate().resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/media/studio/${name}-${w}.webp`)
    studio[sku].push(name)
  }
}
writeFileSync('src/data/studio.json', JSON.stringify(studio, null, 1))
console.log(Object.keys(mens).length, 'men\'s rings,', Object.values(mens).flat().length, 'photographs')
