// T1 acceptance: the world shell.
//   - renderer created exactly once across client-side navigations
//   - the URL updates on each navigation
//   - browser back reverses the camera move (camera position mid-way through the move back
//     lies between the two rooms, and it ends at the room it started from)
// Screenshots to verify/T1-*.png at 1440×900 and 390×844.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
mkdirSync('verify', { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})

const runs = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]
const report = {}
for (const run of runs) {
  const ctx = await browser.newContext(run)
  const page = await ctx.newPage()
  const created = []
  const errors = []
  page.on('console', (m) => {
    if (m.text().includes('[world] renderer created')) created.push(m.text())
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  const cam = () => page.evaluate(() => window.__world?.camera() ?? null)
  const waitReady = () => page.waitForFunction(() => document.documentElement.dataset.worldReady === '1', null, { timeout: 60_000 })

  await page.goto(base + '/', { waitUntil: 'load', timeout: 120_000 })
  await waitReady()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `verify/T1-${run.name}-1-home.png` })
  const camHome = await cam()

  // Client-side navigation to a collection (Tray room).
  await page.evaluate(() => window.__world.navigate('/necklaces'))
  await page.waitForURL('**/necklaces', { timeout: 60_000 })
  await page.waitForFunction((x0) => Math.abs((window.__world?.camera()?.x ?? x0) - x0) > 0.05, camHome.x, { timeout: 30_000, polling: 50 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `verify/T1-${run.name}-2-moving.png` })
  await page.waitForTimeout(2400)
  await page.screenshot({ path: `verify/T1-${run.name}-3-tray.png` })
  const camTray = await cam()

  // Browser back: the camera should travel back the way it came.
  await page.goBack()
  await page.waitForURL(base + '/', { timeout: 60_000 })
  // Wait for the camera to start leaving the tray, then sample it mid-flight.
  await page.waitForFunction((x0) => Math.abs((window.__world?.camera()?.x ?? x0) - x0) > 0.05, camTray.x, { timeout: 30_000, polling: 50 })
  await page.waitForTimeout(700)
  const camMid = await cam()
  await page.screenshot({ path: `verify/T1-${run.name}-4-back-moving.png` })
  await page.waitForTimeout(2400)
  await page.screenshot({ path: `verify/T1-${run.name}-5-back-home.png` })
  const camBack = await cam()

  const between = camMid && camHome && camTray && camMid.x > Math.min(camHome.x, camTray.x) - 0.5 && camMid.x < Math.max(camHome.x, camTray.x) + 0.5 && Math.abs(camMid.x - camHome.x) > 1 && Math.abs(camMid.x - camTray.x) > 1
  report[run.name] = {
    rendererCreated: created.length,
    urls: ['/', '/necklaces', '/ (back)'],
    camHome,
    camTray,
    camMidBack: camMid,
    camBack,
    backReversesMove: Boolean(between && Math.hypot(camBack.x - camHome.x, camBack.z - camHome.z) < 0.6),
    errors: errors.filter((e) => !e.includes('Failed to fetch')).slice(0, 5),
  }
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(report, null, 2))
