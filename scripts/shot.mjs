// Visual check: screenshots a page at desktop and phone sizes with the local Chrome.
//   node scripts/shot.mjs <path> <outDir> [--phone-only] [--throttle]
// --throttle applies 4x CPU slowdown on the phone run, roughly a mid-range Android.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const [, , path = '/', outDir = 'shots', ...flags] = process.argv
const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  // Use the real GPU so the 3D house renders as it would for a visitor.
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
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
  await page.goto(base + path, { waitUntil: 'load', timeout: 90_000 })
  // Wait for the 3D world to draw this page's scene (or give up after 25 s and capture the HTML).
  const worldReady = await page
    .waitForFunction(() => document.documentElement.dataset.worldReady === '1', null, { timeout: 25_000 })
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(1800)
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
  await page.waitForTimeout(1500)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (flags.includes('--stations')) {
    // Stop at each station of the homepage walk: centre its anchor, let the camera settle.
    const ys = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-anchor]')).map((el) => {
        const r = el.getBoundingClientRect()
        return Math.max(0, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2)
      }),
    )
    for (let i = 0; i < ys.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(ys[i]))
      await page.waitForTimeout(3200)
      await page.screenshot({ path: `${outDir}/${slug}-${run.name}-s${i}.png` })
    }
  } else if (flags.includes('--frames')) {
    // The 3D world is fixed behind the page, so a full-page capture can't show it.
    // Instead, capture the viewport at several scroll positions as the camera moves.
    const h = await page.evaluate(() => document.body.scrollHeight)
    const n = 6
    for (let i = 0; i < n; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(((h - run.viewport.height) * i) / (n - 1)))
      await page.waitForTimeout(2200)
      await page.screenshot({ path: `${outDir}/${slug}-${run.name}-f${i}.png` })
    }
  } else {
    await page.screenshot({ path: `${outDir}/${slug}-${run.name}.png`, fullPage: true })
  }
  console.log(JSON.stringify({ run: run.name, worldReady, loadMs: Date.now() - t0, lcp, cls, horizontalOverflowPx: overflow, errors }))
  await ctx.close()
}
await browser.close()
