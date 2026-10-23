// Screenshots of the ring room's velvet cones (desktop and phone) at a few points along the
// row, and the studio gallery on a ring's page. BASE=http://localhost:3001 node scripts/look-cones.mjs
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const piece = process.env.PIECE ?? '/piece/filigree-heart-ring'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const mode of (process.env.MODES ?? 'desk,phone').split(',')) {
  const ctx = await browser.newContext(mode === 'phone' ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(mode, 'pageerror', e.message.slice(0, 160)))
  page.on('console', (m) => m.type() === 'error' && console.log(mode, 'console', m.text().slice(0, 160)))
  await page.goto(base + '/rings', { waitUntil: 'load' })
  await page.waitForTimeout(6000)
  for (const [k, p] of [0, 0.12, 0.45].entries()) {
    await page.evaluate((p) => {
      const s = document.querySelector('#room-rings')
      const top = s.getBoundingClientRect().top + scrollY
      scrollTo(0, top + p * (s.offsetHeight - innerHeight))
    }, p)
    await page.waitForTimeout(3500)
    await page.screenshot({ path: `look/oct23/cones-${mode}-${k}.jpg`, type: 'jpeg', quality: 72 })
  }
  await page.goto(base + piece, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  await page.evaluate(() => document.querySelector('#studio')?.scrollIntoView())
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `look/oct23/studio-${mode}.jpg`, type: 'jpeg', quality: 72 })
  await ctx.close()
}
await browser.close()
