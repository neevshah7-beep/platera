import { chromium } from 'playwright-core'
const [, , url] = process.argv
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(url, { waitUntil: 'load' })
await page.waitForSelector('.ceremony-canvas')
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(900)
  await page.screenshot({ path: `look/e2e/pack-${i}.png`, clip: { x: 200, y: 64, width: 1040, height: 760 } })
}
await browser.close()
