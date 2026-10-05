// The original photographs, exactly as taken at the store (no background removal),
// for the "original photographs" galleries. Writes public/media/originals/<name>-{800,1600}.webp
// and src/data/originals.json: { "PLT-NKS-001": ["PLT-NKS-001-01", ...] } grouped by SKU.
import sharp from 'sharp'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
const src = 'assets/sorted'
const out = 'public/media/originals'
mkdirSync(out, { recursive: true })
const groups = {}
for (const f of readdirSync(src).filter((x) => /\.(jpe?g|png)$/i.test(x)).sort()) {
  const name = f.replace(/\.[^.]+$/, '')
  const sku = name.replace(/-\d+$/, '')
  ;(groups[sku] ??= []).push(name)
  for (const w of [800, 1600]) {
    await sharp(`${src}/${f}`).rotate().resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${out}/${name}-${w}.webp`)
  }
}
writeFileSync('src/data/originals.json', JSON.stringify(groups, null, 1))
console.log(Object.keys(groups).length, 'pieces,', Object.values(groups).flat().length, 'photographs')
