// Close views of pieces in relief: the ring cones (two moments, to see a ring turn) and the
// pendant cases. BASE=http://localhost:3000 node scripts/look-relief.mjs
import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 160)))
for (const [room, id] of [['/rings', '#room-rings'], ['/pendants', '#room-pendants']]) {
  await page.goto(base + room, { waitUntil: 'load' })
  await page.waitForTimeout(7000)
  await page.evaluate((id) => { const s = document.querySelector(id); scrollTo(0, s.getBoundingClientRect().top + scrollY + 0.12 * (s.offsetHeight - innerHeight)) }, id)
  await page.waitForTimeout(4000)
  for (const k of [0, 1]) {
    await page.screenshot({ path: `look/oct23/relief${room.replace('/', '-')}-${k}.jpg`, type: 'jpeg', quality: 80 })
    await page.waitForTimeout(3500)
  }
}
await browser.close()
