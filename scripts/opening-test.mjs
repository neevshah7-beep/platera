// The first seconds of a first visit on a slowed phone: load, wait for the gate, tap
// Enter, and record every frame through the clouds and the fall. BASE, THROTTLE, DEVICE.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ ...devices[process.env.DEVICE ?? 'Pixel 7'], defaultBrowserType: undefined })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE ?? 4) })
await page.addInitScript(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push([Math.round(n), n - l]); l = n; requestAnimationFrame(t) }; requestAnimationFrame(t) })
const t0 = Date.now()
await page.goto(base + '/', { waitUntil: 'load', timeout: 90000 })
console.log('loaded in', Date.now() - t0, 'ms')
const enter = page.getByRole('button', { name: /enter/i }).first()
await enter.waitFor({ state: 'visible', timeout: 60000 })
console.log('gate ready at', Date.now() - t0, 'ms')
await page.waitForTimeout(1500)
const tapAt = await page.evaluate(() => performance.now())
await enter.tap()
await page.waitForTimeout(9000)
const r = await page.evaluate((tapAt) => {
  const span = (a, b) => { const f = window.__f.filter(([t]) => t >= a && t < b).map(([, d]) => d).sort((x, y) => x - y); return { fps: Math.round(1000 / (f.reduce((s, x) => s + x, 0) / Math.max(1, f.length))), p95: Math.round(f[Math.floor(f.length * 0.95)] ?? 0), worst: Math.round(f.at(-1) ?? 0), over50: f.filter((x) => x > 50).length } }
  return { gate: span(tapAt - 1500, tapAt), clouds: span(tapAt, tapAt + 4000), fall: span(tapAt + 4000, tapAt + 9000) }
}, tapAt)
console.log(JSON.stringify(r, null, 1))
await browser.close()
