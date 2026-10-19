// Walks the homepage like a visitor and counts the requests it makes, by kind.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ ...devices['Pixel 7'], defaultBrowserType: undefined })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
const kinds = {}
let bytes = 0
const errs = []
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)))
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
page.on('requestfinished', async (r) => {
  const u = new URL(r.url())
  const k = u.pathname.startsWith('/scenes/') ? (u.pathname.endsWith('.pack') ? 'scene packs' : 'scene single files') : u.pathname.startsWith('/_next/') ? 'app code' : u.pathname.startsWith('/media/') ? 'photos' : 'other'
  kinds[k] = (kinds[k] ?? 0) + 1
  try { bytes += (await r.sizes()).responseBodySize } catch {}
})
await page.goto(base + '/', { waitUntil: 'load' })
const H = await page.evaluate(() => document.documentElement.scrollHeight)
for (let i = 0; i <= 30; i++) { await page.evaluate((y) => scrollTo(0, y), (i / 30) * H); await page.waitForTimeout(700) }
console.log(kinds, (bytes / 1048576).toFixed(1), 'MB', errs.length ? errs : 'no errors')
await browser.close()
