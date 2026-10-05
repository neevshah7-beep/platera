/**
 * Web versions of the Blender hero renders (transparent PNGs from assets/blender):
 * AVIF + WebP at several widths, alpha kept so the plinth's shadow falls on the page.
 *   npx tsx scripts/process-hero.ts
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const jobs = [
  { src: 'assets/blender/hero_desktop.png', name: 'hero-desktop', widths: [1280, 1920, 2560] },
  { src: 'assets/blender/hero_phone.png', name: 'hero-phone', widths: [540, 810, 1080] },
]
mkdirSync('public/media/hero', { recursive: true })
for (const j of jobs) {
  for (const w of j.widths) {
    const img = sharp(j.src).resize({ width: w })
    await img.clone().avif({ quality: 60, effort: 5 }).toFile(`public/media/hero/${j.name}-${w}.avif`)
    await img.clone().webp({ quality: 82 }).toFile(`public/media/hero/${j.name}-${w}.webp`)
  }
  console.log(j.name, 'done')
}
