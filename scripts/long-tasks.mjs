// Every long task (>50 ms) while scrolling briskly through the homepage, with the functions
// that ran in it (CPU profile samples inside each task's time window).
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(4000)
const cdp = await ctx.newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 250 })
await page.evaluate(() => {
  window.__lt = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([e.startTime, e.duration, Math.round(scrollY / innerHeight * 10) / 10]))).observe({ type: 'longtask' })
})
const t0 = await page.evaluate(() => performance.now())
await cdp.send('Profiler.start')
await page.mouse.move(700, 450)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < H; y += 140) { await page.mouse.wheel(0, 140); await page.waitForTimeout(70) }
await page.waitForTimeout(1500)
const { profile } = await cdp.send('Profiler.stop')
const lt = await page.evaluate(() => window.__lt)
// Sample times on the profile clock (µs from profile.startTime).
const byId = new Map(profile.nodes.map((n) => [n.id, n]))
const parent = new Map()
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id)
let tt = profile.startTime
const samples = profile.samples.map((sid, i) => ((tt += profile.timeDeltas[i]), [tt, sid]))
const perfOrigin = profile.startTime / 1000 - t0 // ms offset between clocks (approx.)
for (const [start, dur, sy] of lt.filter((x) => x[1] > 70)) {
  const a = (start + perfOrigin) * 1000, b = a + dur * 1000
  const fns = new Map()
  for (const [t, sid] of samples) {
    if (t < a || t > b) continue
    // Attribute to the nearest of our own frames up the stack (src files), else the leaf.
    let n = byId.get(sid), label = null
    let p = sid
    while (p) {
      const f = byId.get(p).callFrame
      if (/\/src\//.test(f.url) || /\.tsx?$/.test(f.url.split('?')[0])) { label = `${f.functionName || '(anon)'}:${f.url.split('/').pop()}:${f.lineNumber}`; break }
      p = parent.get(p)
    }
    label ??= n.callFrame.functionName || '(native)'
    fns.set(label, (fns.get(label) ?? 0) + 0.25)
  }
  const top = [...fns].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${v.toFixed(0)}ms`).join(' | ')
  console.log(`${Math.round(dur)}ms @${sy}: ${top}`)
}
await browser.close()
