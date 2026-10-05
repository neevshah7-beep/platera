import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180_000 })
await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120_000 })
await page.click('.entry-enter')
await page.waitForTimeout(1200)
const col = await page.evaluate(() => document.querySelector('#collection-title').closest('section'))
const top = await page.evaluate(() => document.querySelector('#collection-title').closest('section').getBoundingClientRect().top + scrollY)
const h = await page.evaluate(() => document.querySelector('#collection-title').closest('section').getBoundingClientRect().height)
for (const f of [0.05, 0.35, 0.7]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(top + f * (h - 900)))
  await page.waitForTimeout(5000)
  await page.screenshot({ path: `look/col-${f}.png` })
}
void col
await browser.close()
