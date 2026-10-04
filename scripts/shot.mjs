// Visual check: screenshots a page at desktop and phone sizes with the local Chrome.
//   node scripts/shot.mjs <path> <outDir> [--phone-only] [--throttle]
// --throttle applies 4x CPU slowdown on the phone run, roughly a mid-range Android.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const [, , path = '/', outDir = 'shots', ...flags] = process.argv
const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const runs = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
].filter((r) => !flags.includes('--phone-only') || r.name === 'phone')

const slug = path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'
for (const run of runs) {
  const ctx = await browser.newContext(run)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  if (run.name === 'phone' && flags.includes('--throttle')) {
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  }
  const t0 = Date.now()
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const lcp = await page.evaluate(
    () =>
      new Promise((resolve) => {
        new PerformanceObserver((l) => {
          const e = l.getEntries().at(-1)
          resolve({ ms: Math.round(e.startTime), el: e.element?.tagName + (e.element?.className ? '.' + String(e.element.className).slice(0, 40) : '') })
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        setTimeout(() => resolve(null), 3000)
      }),
  )
  const cls = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let v = 0
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (v += e.value))).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => resolve(Number(v.toFixed(4))), 1500)
      }),
  )
  // Walk down the page so lazy images load before the full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  await page.screenshot({ path: `${outDir}/${slug}-${run.name}.png`, fullPage: true })
  console.log(JSON.stringify({ run: run.name, loadMs: Date.now() - t0, lcp, cls, horizontalOverflowPx: overflow, errors }))
  await ctx.close()
}
await browser.close()
