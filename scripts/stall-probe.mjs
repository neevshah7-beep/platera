// Scrolls the homepage with real wheel input and lists every long frame with the chapter in
// view, plus the scene manager's build timings (dev server logs them).
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => m.text().startsWith('[scene]') && logs.push(Math.round(performance.now()) + ' ' + m.text()))
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(4000)
await page.evaluate(() => {
  window.__long = []
  let last = performance.now()
  const f = (t) => {
    const d = t - last
    if (d > 40) {
      const id = [...document.querySelectorAll('section[id^="chapter-"]')].find((s) => { const r = s.getBoundingClientRect(); return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2 })?.id ?? 'other'
      window.__long.push([Math.round(d), id, Math.round(scrollY / innerHeight * 10) / 10])
    }
    last = t
    requestAnimationFrame(f)
  }
  requestAnimationFrame(f)
})
await page.mouse.move(700, 450)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
// A brisk but human pace: a flick every 70 ms.
for (let y = 0; y < H; y += 140) { await page.mouse.wheel(0, 140); await page.waitForTimeout(70) }
await page.waitForTimeout(1500)
console.log(JSON.stringify(await page.evaluate(() => window.__long)))
console.log(logs.join('\n'))
await browser.close()
