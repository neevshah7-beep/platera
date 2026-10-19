// Phone-sized copies of every rendered sequence: the longest side at 960 px, which is
// what a phone screen draws at its capped resolution. About a third of the pixels of the
// full frames, so each frame decodes and uploads to the GPU about three times faster.
// Writes public/scenes/<scene>/m/NNNN.webp; run scripts/pack-frames.mjs after.
import sharp from 'sharp'
import { mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const ROOT = 'public/scenes'
for (const scene of readdirSync(ROOT)) {
  const src = join(ROOT, scene, '1600')
  if (!existsSync(src)) continue
  const out = join(ROOT, scene, 'm')
  mkdirSync(out, { recursive: true })
  const files = readdirSync(src).filter((f) => /^\d{4}\.webp$/.test(f))
  await Promise.all(files.map((f) => sharp(join(src, f)).resize(960, 960, { fit: 'inside' }).webp({ quality: 74, effort: 5 }).toFile(join(out, f))))
  console.log(scene, files.length, 'frames')
}
