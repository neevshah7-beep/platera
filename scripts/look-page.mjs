// Screens down a page at laptop size: node scripts/look-page.mjs <path> <name> [phone]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const [, , path = '/', name = 'page', phone] = process.argv
mkdirSync('look/page', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto((process.env.BASE ?? 'http://localhost:3000') + path, { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(2500)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
const vh = phone ? 844 : 720
const shots = []
for (let y = 0, i = 0; y < H && i < 14; y += vh * 0.9, i++) {
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(1300)
  const f = `look/page/${name}-${String(i).padStart(2, '0')}.png`
  await page.screenshot({ path: f })
  shots.push(f)
}
console.log(H, errors.slice(0, 3), shots.join(' '))
await browser.close()
