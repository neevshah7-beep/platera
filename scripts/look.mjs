// Visual check of the homepage experience: gate, entering, the fall, landed hero, scrubbed.
//   node scripts/look.mjs [outDir]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] ?? 'look'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
})
for (const run of [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await (await browser.newContext(run)).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)))
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}/${run.name}-0-gate.png` })
  await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
  await page.screenshot({ path: `${out}/${run.name}-1-ready.png` })
  await page.click('.entry-enter')
  await page.waitForTimeout(1300)
  await page.screenshot({ path: `${out}/${run.name}-2-falling.png` })
  await page.waitForTimeout(3600)
  if (run.name === 'desktop') await page.mouse.move(820, 330)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}/${run.name}-3-landed.png` })
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}/${run.name}-4-scrub.png` })
  console.log(run.name, 'errors:', errors.slice(0, 5))
}
await browser.close()
