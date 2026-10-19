// CPU profile of one homepage chapter on a slowed phone: scrolls through it while the
// profiler runs and prints the functions that took the most time.
//   CHAPTER=chapter-hallmark THROTTLE=4 node scripts/profile-chapter.mjs
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const CH = process.env.CHAPTER ?? 'chapter-hallmark'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ ...devices['Pixel 7'], defaultBrowserType: undefined })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(2500)
const { top, h, vh } = await page.evaluate((id) => { const s = document.getElementById(id); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight } }, CH)
await page.evaluate((y) => scrollTo(0, y), top - vh * 1.2); await page.waitForTimeout(3000)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE ?? 4) })
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start')
await page.evaluate(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push(n - l); l = n; requestAnimationFrame(t) }; requestAnimationFrame(t) })
for (let i = 0; i <= 24; i++) { await page.evaluate((y) => scrollTo(0, y), top - vh + (i / 24) * (h + vh)); await page.waitForTimeout(250) }
const { profile } = await cdp.send('Profiler.stop')
const f = await page.evaluate(() => { const a = [...window.__f].sort((x, y) => x - y); return { p50: Math.round(a[a.length >> 1]), p95: Math.round(a[Math.floor(a.length * 0.95)]), slow: a.filter((x) => x > 50).length, n: a.length } })
const self = new Map()
const dt = profile.timeDeltas
const byId = new Map(profile.nodes.map((n) => [n.id, n]))
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop().slice(0, 40)}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) ?? 0) + (dt[i] ?? 0)) })
console.log(CH, 'frames', f)
for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(String(Math.round(v / 1000)).padStart(6), 'ms', k)
await browser.close()
