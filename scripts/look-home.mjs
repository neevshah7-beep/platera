// The homepage chapter by chapter: each boundary (half of one chapter, half of the next)
// and each chapter's middle. node scripts/look-home.mjs [phone]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look/home', { recursive: true })
const phone = process.argv[2] === 'phone'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(process.env.BASE ?? 'http://localhost:3000/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(2500)
const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id^="chapter-"]')].map((s) => s.id))
const out = []
for (const id of ids) {
  const at = await page.evaluate((id) => {
    const s = document.getElementById(id)
    const top = s.getBoundingClientRect().top + scrollY
    return { top, h: s.offsetHeight }
  }, id)
  for (const [tag, y] of [['edge', at.top - innerHeightGuess() * 0.5], ['mid', at.top + Math.max(0, at.h - innerHeightGuess()) * 0.5]]) {
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), y)
    await page.waitForTimeout(2200)
    const f = `look/home/${phone ? 'p-' : ''}${String(out.length).padStart(2, '0')}-${id.replace('chapter-', '')}-${tag}.png`
    await page.screenshot({ path: f })
    out.push(f)
  }
}
function innerHeightGuess() { return phone ? 844 : 720 }
const H = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight)
console.log('screens', H.toFixed(1), errors.slice(0, 3))
console.log(out.join(' '))
await browser.close()
