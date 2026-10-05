import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
mkdirSync('look', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
await page.goto(process.env.BASE ?? 'http://localhost:3000/', { waitUntil: 'load', timeout: 180000 })
await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120000 })
await page.click('.entry-enter')
const t0 = Date.now()
for (const ms of [300, 900, 1500, 2000, 2500, 3100, 4200]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)))
  await page.screenshot({ path: `look/cloud-${ms}.png` })
}
console.log(errors.slice(0, 5))
await browser.close()
