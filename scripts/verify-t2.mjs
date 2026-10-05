// T2 acceptance: every pass toggles visibly. Captures the chain all-on, all-off, and with
// each pass switched off on its own (1440×900 and 390×844), plus the frame rate.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
const path = process.argv[2] ?? '/'
mkdirSync('verify/T2', { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const PASSES = ['gtao', 'ssr', 'dof', 'motionBlur', 'bloom', 'chromatic', 'lut', 'vignette', 'grain', 'taa']
const runs = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]
const out = {}
for (const run of runs) {
  const ctx = await browser.newContext(run)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(base + path + '?tier=3', { waitUntil: 'load', timeout: 120_000 })
  await page.waitForFunction(() => document.documentElement.dataset.worldReady === '1' && window.__world?.post, null, { timeout: 90_000 })
  await page.waitForTimeout(3000)
  const set = (patch) => page.evaluate((p) => window.__world.post.set(p), patch)
  const all = (v) => Object.fromEntries(PASSES.map((p) => [p, v]))
  const fps = () =>
    page.evaluate(
      () =>
        new Promise((res) => {
          let n = 0
          const t0 = performance.now()
          const tick = () => (++n < 120 ? requestAnimationFrame(tick) : res(Math.round((n * 1000) / (performance.now() - t0))))
          requestAnimationFrame(tick)
        }),
    )
  await set(all(true))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `verify/T2/${run.name}-all-on.png` })
  const fpsOn = await fps()
  await set(all(false))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `verify/T2/${run.name}-all-off.png` })
  const fpsOff = await fps()
  for (const p of PASSES) {
    await set({ ...all(true), [p]: false })
    await page.waitForTimeout(900)
    await page.screenshot({ path: `verify/T2/${run.name}-without-${p}.png` })
  }
  await set(all(true))
  out[run.name] = { fpsAllOn: fpsOn, fpsAllOff: fpsOff, errors: errors.slice(0, 6) }
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(out, null, 2))
