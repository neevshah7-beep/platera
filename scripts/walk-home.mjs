// Walks the whole homepage in even steps (phone by default, "desk" for desktop with real wheel),
// one screenshot per step, and reports frame times per step so a slow chapter shows by name.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const desk = process.argv[2] === 'desk'
const STEPS = Number(process.env.STEPS ?? 28)
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(desk ? { viewport: { width: 1440, height: 900 } } : { ...devices[process.env.DEVICE ?? 'iPhone 13'], defaultBrowserType: undefined })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
// THROTTLE=4 slows the processor fourfold, roughly a mid-range Android phone.
if (process.env.THROTTLE) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) })
page.on('console', (m) => m.type() === 'error' && !/X4122|X3595|GL Driver/.test(m.text()) && console.log('console:', m.text().slice(0, 160)))
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 160)))
await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(2500)
const { h, vh } = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }))
await page.evaluate(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push(n - l); l = n; requestAnimationFrame(t) }; requestAnimationFrame(t) })
const tag = desk ? 'wd' : 'wp'
if (desk) await page.mouse.move(720, 450)
for (let i = 0; i < STEPS; i++) {
  await page.screenshot({ path: `look/${tag}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 55 })
  const target = Math.round(((i + 1) / STEPS) * (h - vh))
  await page.evaluate(() => (window.__f.length = 0))
  if (desk) { for (let s = 0; s < 40; s++) { const y = await page.evaluate(() => scrollY); if (y >= target - 60) break; await page.mouse.wheel(0, 240); await page.waitForTimeout(60) } }
  else await page.evaluate((y) => scrollTo({ top: y, behavior: 'smooth' }), target)
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => { const f = [...window.__f].sort((a, b) => a - b); const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('section'); return { y: Math.round(scrollY), worst: Math.round(f.at(-1) ?? 0), p95: Math.round(f[Math.floor(f.length * 0.95)] ?? 0), over40: f.filter((x) => x > 40).length, sec: el?.id || el?.getAttribute('aria-label') || '' } })
  console.log(String(i).padStart(2), String(r.y).padStart(6), (r.sec || '').padEnd(22), 'p95', String(r.p95).padStart(3), 'worst', String(r.worst).padStart(4), r.over40 ? `(${r.over40} slow frames)` : '')
}
await browser.close()
