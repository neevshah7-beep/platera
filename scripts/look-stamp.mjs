// The hallmark under real, brisk wheel scrolling: screenshots and the phase as it plays.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look/stamp', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(2500)
await page.evaluate(() => window.scrollTo(0, document.getElementById('chapter-hallmark').getBoundingClientRect().top + scrollY - innerHeight * 2.2))
await page.waitForTimeout(800)
await page.mouse.move(640, 360)
const shots = []
for (let i = 0; i < 26; i++) {
  await page.mouse.wheel(0, 110)
  await page.waitForTimeout(140)
  if (i % 3 === 2) {
    const info = await page.evaluate(() => {
      const s = document.getElementById('chapter-hallmark')
      const r = s.getBoundingClientRect()
      return { p: Math.round((-r.top / (r.height - innerHeight)) * 100) / 100, phase: document.querySelector('.stamp-hold')?.dataset.phase, shown: document.querySelector('#chapter-hallmark canvas')?.dataset.shown }
    })
    const f = `look/stamp/${String(i).padStart(2, '0')}.png`
    await page.screenshot({ path: f })
    shots.push(f)
    console.log(i, JSON.stringify(info))
  }
}
await page.waitForTimeout(1200)
await page.screenshot({ path: 'look/stamp/zz-settled.png' })
console.log(shots.join(' '))
await browser.close()
