// The packing scene before checkout: add a piece, open /checkout/prepare, shoot the acts.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look/prep', { recursive: true })
const base = 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${base}/piece/${process.argv[2] ?? 'station-chain-set'}`)
await page.getByRole('button', { name: 'Add to bag' }).first().click()
await page.getByText('Added to your bag.').waitFor()
await page.goto(`${base}/checkout/prepare`)
await page.waitForSelector('.ceremony-canvas[data-started]', { timeout: 60_000 })
const t0 = Date.now()
for (const s of [1, 3.5, 5.5, 7.5, 9, 10.5, 11.6, 12.4, 13.4, 14.4, 16]) {
  await page.waitForTimeout(Math.max(0, s * 1000 - (Date.now() - t0)))
  await page.screenshot({ path: `look/prep/${String(Math.round(s * 10)).padStart(4, '0')}.png` })
}
console.log(errors.slice(0, 3))
// Empty the bag again.
await page.goto(`${base}/bag`)
for (const b of await page.getByRole('button', { name: /Remove/ }).all()) await b.click().catch(() => {})
await browser.close()
