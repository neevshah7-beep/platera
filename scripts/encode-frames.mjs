// Encodes a rendered frame sequence for the web: WebP at two widths.
//   node scripts/encode-frames.mjs fall
// Reads assets/render/<scene>/####.png, writes public/scenes/<scene>/<width>/####.webp and
// public/scenes/<scene>/manifest.json ({ frames, widths, width, height }).
import sharp from 'sharp'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const scene = process.argv[2]
if (!scene) throw new Error('usage: node scripts/encode-frames.mjs <scene>')
const src = join('assets', 'render', scene)
const out = join('public', 'scenes', scene)
const widths = [1600, 1000]
const files = readdirSync(src).filter((f) => f.endsWith('.png')).sort()
let meta
for (const w of widths) mkdirSync(join(out, String(w)), { recursive: true })
let bytes = { 1600: 0, 1000: 0 }
for (const [i, f] of files.entries()) {
  const img = sharp(join(src, f))
  meta ??= await img.metadata()
  for (const w of widths) {
    const name = String(i + 1).padStart(4, '0') + '.webp'
    const info = await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: w > 1200 ? 84 : 80, effort: 5, smartSubsample: true }).toFile(join(out, String(w), name))
    bytes[w] += info.size
  }
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ frames: files.length, widths, width: meta.width, height: meta.height }, null, 2))
console.log(scene, files.length, 'frames', Object.fromEntries(Object.entries(bytes).map(([w, b]) => [w, (b / 1e6).toFixed(1) + ' MB'])))
