import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const only = process.env.ONLY
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const run of [{ name: 'laptop', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 }, { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }].filter((r) => !only || r.name === only)) {
  const ctx = await browser.newContext(run)
  await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(process.env.BASE ?? 'http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForTimeout(1500)
  const fr = (process.env.F ?? '0.02,0.09,0.2,0.33,0.45,0.62,0.8,0.9,1').split(',').map(Number)
  for (const f of fr) {
    await page.evaluate((f) => { const s = document.getElementById('chapter-sitting'); const y = s.getBoundingClientRect().top + scrollY + f * (s.offsetHeight - innerHeight); window.scrollTo(0, y) }, f)
    await page.waitForTimeout(2200)
    await page.screenshot({ path: `look/sit-${run.name}-${f}.png` })
  }
  if (run.name === 'laptop') {
    await page.evaluate(() => { const s = document.getElementById('chapter-sitting'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY + 0.2 * (s.offsetHeight - innerHeight)) })
    await page.waitForTimeout(1500)
    const b = await page.$$eval('.sit-node', (els) => els.map((e) => ({ o: +e.style.opacity, r: e.querySelector('.sit-print')?.getBoundingClientRect().toJSON() })).filter((x) => x.o > 0.9 && x.r && x.r.width > 50 && x.r.left > 0 && x.r.right < innerWidth))
    if (b[0]) { await page.mouse.click(b[0].r.left + b[0].r.width / 2, b[0].r.top + b[0].r.height / 2); await page.waitForTimeout(1600); await page.screenshot({ path: `look/sit-laptop-lightbox.png` }) }
  }
  console.log(run.name, errors.slice(0, 3))
}
await browser.close()
