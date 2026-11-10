import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
for (const mode of ['desk', 'phone']) {
  const ctx = await browser.newContext(mode === 'phone' ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(mode, 'pageerror', e.message.slice(0, 160)))
  await page.goto(base + '/leg-rings', { waitUntil: 'load' }); await page.waitForTimeout(2500)
  await page.screenshot({ path: `look/nov10/leg-room-${mode}.jpg`, type: 'jpeg', quality: 70 })
  await page.evaluate(() => scrollTo(0, 600)); await page.waitForTimeout(1200)
  await page.screenshot({ path: `look/nov10/leg-room2-${mode}.jpg`, type: 'jpeg', quality: 70 })
  await page.goto(base + '/piece/swan-heart-leg-rings', { waitUntil: 'load' }); await page.waitForTimeout(2500)
  await page.screenshot({ path: `look/nov10/leg-piece-${mode}.jpg`, type: 'jpeg', quality: 70 })
  await ctx.close()
}
await browser.close()
