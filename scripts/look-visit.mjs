import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const run of [{ name: 'desktop', viewport: { width: 1440, height: 900 } }, { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]) {
  const page = await (await browser.newContext(run)).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
  await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
  await page.click('.entry-enter')
  await page.waitForTimeout(1000)
  const top = await page.evaluate(() => document.querySelector('#visit-title').closest('section').getBoundingClientRect().top + scrollY)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(top))
  await page.waitForTimeout(4500)
  await page.screenshot({ path: `look/visit-${run.name}-0.png` })
  if (run.name === 'desktop') {
    await page.mouse.move(1000, 620)
    await page.mouse.down()
    await page.mouse.move(1000, 420, { steps: 8 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'look/visit-desktop-1-mid.png' })
    await page.mouse.move(1000, 160, { steps: 6 })
    await page.mouse.up()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'look/visit-desktop-2-next.png' })
  }
  console.log(run.name, errors.slice(0, 3))
}
await browser.close()
