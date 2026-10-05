import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && !m.text().includes('X4122') && console.log('[c]', m.text().slice(0, 300)))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 180000 })
await page.waitForSelector('.entry-enter[data-ready="true"]', { timeout: 120000 }).catch(() => {})
await page.click('.entry-enter').catch(() => {})
await page.waitForTimeout(2000)
for (const id of ['chapter-promises', 'chapter-hallmark', 'chapter-collection']) {
  const y = await page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top + scrollY, id)
  await page.evaluate((v) => scrollTo(0, v + 900), y)
  await page.waitForTimeout(3500)
}
for (const t of [1, 4, 8]) { await page.waitForTimeout(t * 1000); await page.screenshot({ path: `look/col-t${t}.png` }) }
console.log('contexts lost?', await page.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => { const g = c.getContext('webgl2'); return g ? g.isContextLost() : 'none' })))
await browser.close()
