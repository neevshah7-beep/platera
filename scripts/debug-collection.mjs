import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('console', (m) => console.log('[c]', m.text().slice(0, 200)))
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
await page.click('.entry-enter')
await page.waitForTimeout(1200)
const col = await page.evaluate(() => document.querySelector('#collection-title').closest('section').getBoundingClientRect().top + scrollY)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(col + 1080))
await page.waitForTimeout(3500)
for (const [x, y] of [[560, 560], [600, 600], [1150, 420]]) {
  await page.mouse.move(x, y, { steps: 5 })
  await page.waitForTimeout(800)
  console.log(x, y, 'label', await page.locator('.collection-label').count())
}
await browser.close()
