// Phone: the first seconds of the homepage, as a returning visitor and as a new one.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const mode of ['back', 'new']) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined })
  if (mode === 'back') await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && console.log(mode, 'console:', m.text().slice(0, 160)))
  await page.goto(base + '/', { waitUntil: 'commit' })
  const t0 = Date.now()
  for (const t of [600, 1800, 3500, 6000]) {
    await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)))
    await page.screenshot({ path: `look/ph-${mode}-${t}.jpg`, type: 'jpeg', quality: 60 })
  }
  if (mode === 'new') {
    const b = page.getByRole('button', { name: /enter/i }).first()
    if (await b.count()) { await b.tap().catch((e) => console.log('tap failed', e.message.slice(0, 80))); for (const t of [700, 2000, 4000, 7000]) { await page.waitForTimeout(t === 700 ? 700 : t - [700, 2000, 4000, 7000][[700, 2000, 4000, 7000].indexOf(t) - 1]); await page.screenshot({ path: `look/ph-new-in-${t}.jpg`, type: 'jpeg', quality: 60 }) } }
    else console.log('no enter button')
  }
  await ctx.close()
}
await browser.close()
