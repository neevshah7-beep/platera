// The photograph rooms (rings, pendants, bangles) and a piece page, on desktop and phone,
// plus the viewer opened from a print. BASE=http://localhost:3000 node scripts/look-photo-rooms.mjs
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3000'
const pieces = (process.env.PIECES ?? '/piece/turquoise-panther-ring,/piece/pink-pear-halo-bangles').split(',')
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
for (const mode of (process.env.MODES ?? 'desk,phone').split(',')) {
  const ctx = await browser.newContext(mode === 'phone' ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(mode, 'pageerror', e.message.slice(0, 160)))
  for (const room of ['/rings', '/pendants', '/bangles']) {
    await page.goto(base + room, { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `look/oct30/room${room.replace('/', '-')}-${mode}.jpg`, type: 'jpeg', quality: 70 })
  }
  await page.goto(base + '/rings', { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const chips = await page.$$('.room-chips button')
  if (chips[2]) { await chips[2].click(); await page.waitForTimeout(800) }
  await page.evaluate(() => scrollTo(0, 500)); await page.waitForTimeout(800)
  await page.screenshot({ path: `look/oct30/room-mens-${mode}.jpg`, type: 'jpeg', quality: 70 })
  await page.click('.room-print'); await page.waitForTimeout(1800)
  await page.screenshot({ path: `look/oct30/viewer-${mode}.jpg`, type: 'jpeg', quality: 70 })
  for (const [k, p] of pieces.entries()) {
    await page.goto(base + p, { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `look/oct30/piece${k}-${mode}.jpg`, type: 'jpeg', quality: 70 })
  }
  await ctx.close()
}
await browser.close()
