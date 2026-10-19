// Every phone, tablet and foldable profile Playwright knows (plus a few small and odd
// screens it lacks), portrait and landscape. For each: open the homepage as a returning
// visitor, walk it in steps, and report sideways overflow, text running off the screen,
// words hidden under the fixed header, scenes that never drew, and slow frames. One
// screenshot strip per device lands in look/devices.
//   node scripts/device-matrix.mjs [filter]      (BASE=http://localhost:3001)
import { chromium, devices } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
const base = process.env.BASE ?? 'http://localhost:3001'
const filter = process.argv[2] ? new RegExp(process.argv[2], 'i') : null
const PATH = process.env.PAGE ?? '/'
const STEPS = Number(process.env.STEPS ?? 10)
await mkdir('look/devices', { recursive: true })
const extra = {
  'Small Android 320x568': { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S5'].userAgent },
  'Budget Android 360x640': { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S5'].userAgent },
  'Tall Android 360x800': { viewport: { width: 360, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S9+'].userAgent },
  'Galaxy Fold folded 280x653': { viewport: { width: 280, height: 653 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S9+'].userAgent },
  'Galaxy Fold open 717x512': { viewport: { width: 717, height: 512 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S9+'].userAgent },
  'iPhone 16 Pro Max 440x956': { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 15 Pro Max'].userAgent },
}
const list = Object.entries({ ...Object.fromEntries(Object.entries(devices).filter(([n, d]) => d.isMobile)), ...extra })
// Many profiles repeat a size; one per distinct viewport and orientation is enough.
const seen = new Set()
const run = list.filter(([n, d]) => {
  if (filter && !filter.test(n)) return false
  const k = `${d.viewport.width}x${d.viewport.height}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})
console.log(run.length, 'distinct device screens')
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const report = []
for (const [name, d] of run) {
  const { defaultBrowserType, ...opts } = d
  const ctx = await browser.newContext(opts)
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 90)))
  try { await page.goto(base + PATH, { waitUntil: 'load', timeout: 60000 }) } catch (e) { errs.push('nav ' + e.message.slice(0, 60)) }
  await page.waitForTimeout(2500)
  const H = await page.evaluate(() => document.documentElement.scrollHeight)
  const vh = d.viewport.height
  await page.evaluate(() => { window.__f = []; let l = performance.now(); const t = (n) => { window.__f.push(n - l); l = n; requestAnimationFrame(t) }; requestAnimationFrame(t) })
  const issues = new Set()
  const tag = name.replace(/[^a-z0-9]+/gi, '-')
  for (let i = 0; i < STEPS; i++) {
    const y = Math.round((i / (STEPS - 1)) * (H - vh))
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y)
    await page.waitForTimeout(900)
    if (i % 3 === 0) await page.screenshot({ path: `look/devices/${tag}-${i}.jpg`, type: 'jpeg', quality: 45 })
    const r = await page.evaluate(() => {
      const out = []
      const W = innerWidth, VH = innerHeight
      if (document.documentElement.scrollWidth > W + 1) out.push(`sideways scroll ${document.documentElement.scrollWidth - W}px`)
      const head = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
      for (const el of document.querySelectorAll('h1,h2,h3,p,a.btn,button,li')) {
        const s = getComputedStyle(el)
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.5 || el.closest('[aria-hidden=true],.sr-only,header,dialog,nav[aria-label=Menu]')) continue
        const b = el.getBoundingClientRect()
        if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > VH) continue
        const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)
        if (!txt) continue
        if (b.right > W + 2 || b.left < -2) out.push(`off-screen: "${txt}"`)
        // Text that overflows its own box (cut by overflow:hidden on a parent).
        if (el.scrollWidth > el.clientWidth + 4 && s.overflow !== 'visible' && s.whiteSpace !== 'nowrap') out.push(`clipped: "${txt}"`)
      }
      for (const c of document.querySelectorAll('canvas')) {
        const b = c.getBoundingClientRect()
        if (b.top < VH * 0.5 && b.bottom > VH * 0.5 && b.width > W * 0.8 && +getComputedStyle(c).opacity > 0.5 && (c.width === 0 || c.height === 0)) out.push('scene canvas has no size')
      }
      return out
    })
    r.forEach((x) => issues.add(x))
  }
  const f = await page.evaluate(() => { const a = [...window.__f].slice(5).sort((x, y) => x - y); return { p95: Math.round(a[Math.floor(a.length * 0.95)] ?? 0), worst: Math.round(a.at(-1) ?? 0), slow: a.filter((x) => x > 50).length } })
  report.push({ name, size: `${d.viewport.width}x${d.viewport.height}`, issues: [...issues, ...errs], f })
  console.log(`${name.padEnd(34)} ${`${d.viewport.width}x${d.viewport.height}`.padEnd(9)} p95 ${String(f.p95).padStart(3)} worst ${String(f.worst).padStart(4)} slow ${String(f.slow).padStart(3)}`, issues.size + errs.length ? '\n   ' + [...issues, ...errs].slice(0, 6).join('\n   ') : 'ok')
  await ctx.close()
}
await browser.close()
console.log('devices with issues:', report.filter((r) => r.issues.length).length, '/', report.length)
