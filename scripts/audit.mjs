// Legibility audit: captures every homepage section (several points each) and every page,
// at 1440×900 and 390×844, into audit/.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('audit', { recursive: true })
const base = 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const pages = process.argv.slice(2)
const report = []
const RUNS = process.env.LAPTOP === '1' ? [{ name: 'l1280', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 }, { name: 'l1536', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 }] : [{ name: 'd', viewport: { width: 1440, height: 900 } }, { name: 'm', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]
for (const run of RUNS) {
  const ctx = await browser.newContext(run)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  // Home: enter, then stop inside each chapter.
  await page.goto(base + '/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
  await page.click('.entry-enter')
  await page.waitForTimeout(6500)
  await page.screenshot({ path: `audit/${run.name}-home-00-hero.png` })
  const ids = await page.evaluate(() => [...document.querySelectorAll('section[id^="chapter-"]')].map((s) => s.id))
  let k = 1
  for (const id of ids) {
    const [top, h] = await page.evaluate((i) => { const r = document.getElementById(i).getBoundingClientRect(); return [r.top + scrollY, r.height] }, id)
    for (const f of h > run.viewport.height * 1.5 ? [0.25, 0.6] : [0]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(top + f * Math.max(0, h - run.viewport.height)))
      await page.waitForTimeout(3800)
      await page.screenshot({ path: `audit/${run.name}-home-${String(k++).padStart(2, '0')}-${id}-${f}.png` })
    }
  }
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: 'load', timeout: 180_000 })
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `audit/${run.name}-page${p.replace(/[^a-z0-9]+/gi, '_')}.png` })
  }
  report.push({ run: run.name, errors: errors.slice(0, 5) })
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(report))
