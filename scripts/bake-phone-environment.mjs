// Bakes the phone's prefiltered studio light (PMREM of public/env/studio-phone.hdr) into
// public/env/studio-phone-pmrem.png, RGBE-encoded, so phones skip PMREM (about a second of
// work on a mid-range phone, at the moment the first 3D scene appears).
// Run against a local build that has no studio-phone-pmrem.png yet, so it makes it once:
//   BASE=http://localhost:3001 node scripts/bake-phone-environment.mjs
import { chromium, devices } from 'playwright-core'
import sharp from 'sharp'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ ...devices['Pixel 7'], defaultBrowserType: undefined })
const page = await ctx.newPage()
await page.goto(base + '/piece/open-square-necklace-set', { waitUntil: 'load' })
await page.waitForFunction(() => window.__plateraEnv?.()?.data?.length > 0, null, { timeout: 90000 })
const ref = await page.evaluate(() => Array.from(window.__plateraEnv().data.filter((_, i) => i % 97 === 0)))
const { w, h, rgbe } = await page.evaluate(() => {
  const e = window.__plateraEnv()
  const half = (u) => { const s = u & 0x8000 ? -1 : 1, ex = (u >> 10) & 0x1f, f = u & 0x3ff; return ex === 0 ? s * 2 ** -14 * (f / 1024) : ex === 31 ? (f ? NaN : s * Infinity) : s * 2 ** (ex - 15) * (1 + f / 1024) }
  const out = new Uint8Array(e.width * e.height * 4)
  for (let i = 0; i < e.width * e.height; i++) {
    const r = Math.max(0, half(e.data[i * 4])), g = Math.max(0, half(e.data[i * 4 + 1])), b = Math.max(0, half(e.data[i * 4 + 2]))
    const m = Math.max(r, g, b)
    if (m < 1e-32) continue
    const ex = Math.ceil(Math.log2(m))
    const sc = 256 / 2 ** ex
    out[i * 4] = Math.min(255, Math.floor(r * sc)); out[i * 4 + 1] = Math.min(255, Math.floor(g * sc)); out[i * 4 + 2] = Math.min(255, Math.floor(b * sc)); out[i * 4 + 3] = ex + 128
  }
  return { w: e.width, h: e.height, rgbe: Array.from(out) }
})
// Stored as an opaque RGB image twice as tall: the top half the mantissas, the bottom half
// the shared exponent. An alpha channel would be premultiplied (and its colour lost) by
// the browser's decoder; an opaque image comes back exactly.
const px = w * h, img = Buffer.alloc(px * 2 * 3)
for (let i = 0; i < px; i++) {
  img[i * 3] = rgbe[i * 4]; img[i * 3 + 1] = rgbe[i * 4 + 1]; img[i * 3 + 2] = rgbe[i * 4 + 2]
  img[(px + i) * 3] = img[(px + i) * 3 + 1] = img[(px + i) * 3 + 2] = rgbe[i * 4 + 3]
}
await sharp(img, { raw: { width: w, height: h * 2, channels: 3 } }).png({ compressionLevel: 9 }).toFile('public/env/studio-phone-pmrem.png')
console.log('wrote public/env/studio-phone-pmrem.png', w, 'x', h)
// Read it back the way a phone does, and compare with the light it was made from.
const check = await ctx.newPage()
await check.goto(base + '/piece/open-square-necklace-set', { waitUntil: 'load' })
await check.waitForFunction(() => window.__plateraEnv?.()?.data?.length > 0, null, { timeout: 90000 })
const got = await check.evaluate(() => Array.from(window.__plateraEnv().data.filter((_, i) => i % 97 === 0)))
const half = (u) => { const s = u & 0x8000 ? -1 : 1, ex = (u >> 10) & 0x1f, f = u & 0x3ff; return ex === 0 ? s * 2 ** -14 * (f / 1024) : s * 2 ** (ex - 15) * (1 + f / 1024) }
let worst = 0
ref.forEach((u, i) => { if (i % 4 === 3) return; const a = half(u), b = half(got[i]); if (a > 0.01) worst = Math.max(worst, Math.abs(a - b) / a) })
console.log('read back by the phone loader: worst relative error', (worst * 100).toFixed(2) + '%', got.length === ref.length ? '' : '(LENGTH MISMATCH)')
await browser.close()
