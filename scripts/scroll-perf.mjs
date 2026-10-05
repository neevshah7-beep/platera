// Scrolls the homepage top to bottom with real wheel events and reports frame times.
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 })).newPage()
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.evaluate(() => localStorage.setItem('platera:entered', '1'))
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(4000)
await page.evaluate(() => {
  window.__ft = []
  let last = performance.now()
  const f = (t) => { const id = [...document.querySelectorAll('section[id^="chapter-"]')].find((s) => { const r = s.getBoundingClientRect(); return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2 })?.id ?? 'other'; window.__ft.push([t - last, id]); last = t; requestAnimationFrame(f) }
  requestAnimationFrame(f)
})
await page.mouse.move(700, 450)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < H; y += 120) { await page.mouse.wheel(0, 120); await page.waitForTimeout(16) }
await page.waitForTimeout(1500)
const raw = await page.evaluate(() => window.__ft.slice(5))
const by = {}
for (const [d, id] of raw) { (by[id] ??= []).push(d) }
for (const [id, a] of Object.entries(by)) { a.sort((x, y) => x - y); console.log(id.padEnd(20), 'n', a.length, 'median', a[a.length >> 1].toFixed(1), 'p90', a[Math.floor(a.length * 0.9)].toFixed(1), '>33ms', a.filter((x) => x > 33).length) }
const ft = raw.map((r) => r[0]).sort((a, b) => a - b)
const q = (p) => ft[Math.floor(ft.length * p)].toFixed(1)
console.log(JSON.stringify({ frames: ft.length, medianMs: q(0.5), p90: q(0.9), p99: q(0.99), over33ms: ft.filter((x) => x > 33).length, fpsMedian: (1000 / ft[Math.floor(ft.length / 2)]).toFixed(0) }))
await browser.close()
