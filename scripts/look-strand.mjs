// Visual check of Scene 2: enter the site, scroll into the strand, capture promises, try a drag.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] })
for (const run of [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await (await browser.newContext(run)).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)))
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
  await page.click('.entry-enter')
  await page.waitForTimeout(2000)
  const top = await page.evaluate(() => document.querySelector('.strand').getBoundingClientRect().top + scrollY)
  const vh = run.viewport.height
  for (const p of [0.5, 1.5, 2.5, 4.5]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(top + p * vh))
    await page.waitForTimeout(2600)
    await page.screenshot({ path: `look/strand-${run.name}-p${p}.png` })
  }
  if (run.name === 'desktop') {
    await page.mouse.move(700, 500)
    await page.mouse.down()
    await page.mouse.move(820, 330, { steps: 12 })
    await page.waitForTimeout(150)
    await page.screenshot({ path: `look/strand-desktop-drag.png` })
    await page.mouse.up()
  }
  console.log(run.name, 'errors', errors.slice(0, 4))
}
await browser.close()
