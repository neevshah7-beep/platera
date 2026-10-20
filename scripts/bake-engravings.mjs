// Bakes the six bead engravings for phones into public/media/tex/engrave-<name>.png: the
// normal, roughness and colour maps side by side, 256 px each, opaque RGB.
// Run against a local build: BASE=http://localhost:3001 node scripts/bake-engravings.mjs
import { chromium } from 'playwright-core'
import sharp from 'sharp'
const base = process.env.BASE ?? 'http://localhost:3001'
const MARKS = { '925': '925', mg: 'mg', '₹': 'rupee', '15': '15', '7': '7', '◇': 'diamond' }
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
await page.goto(base + '/', { waitUntil: 'load' })
await page.evaluate(() => scrollTo(0, innerHeight * 1.2))
await page.waitForFunction(() => typeof window.__plateraEngrave === 'function', null, { timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
for (const [mark, name] of Object.entries(MARKS)) {
  const urls = await page.evaluate(([m]) => window.__plateraEngrave(m, 256), [mark])
  const tiles = await Promise.all(urls.map((u) => sharp(Buffer.from(u.split(',')[1], 'base64')).removeAlpha().toBuffer()))
  await sharp({ create: { width: 768, height: 256, channels: 3, background: '#000' } })
    .composite(tiles.map((t, i) => ({ input: t, left: i * 256, top: 0 })))
    .png({ compressionLevel: 9 })
    .toFile(`public/media/tex/engrave-${name}.png`)
  console.log('baked', mark, '->', `engrave-${name}.png`)
}
await browser.close()
