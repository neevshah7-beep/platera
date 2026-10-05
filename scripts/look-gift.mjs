import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const only = process.env.ONLY
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const run of [{ name: 'laptop', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 }, { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }].filter((r) => !only || r.name === only)) {
  const ctx = await browser.newContext(run)
  await ctx.addInitScript(() => localStorage.setItem('platera:entered', '1'))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(process.env.BASE ?? 'http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForTimeout(1500)
  const fr = (process.env.F ?? '0.02,0.09,0.2,0.33,0.45,0.62,0.8,0.9,1').split(',').map(Number)
  for (const f of fr) {
    await page.evaluate((f) => { const s = document.getElementById('chapter-gift'); const y = s.getBoundingClientRect().top + scrollY + f * (s.offsetHeight - innerHeight); window.scrollTo(0, y) }, f)
    await page.waitForTimeout(2200)
    await page.screenshot({ path: `look/gift-${run.name}-${f}.png` })
  }
  console.log(run.name, errors.slice(0, 3))
}
await browser.close()
