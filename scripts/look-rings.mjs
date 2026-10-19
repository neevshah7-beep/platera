import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'https://www.platerajewellers.in'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const mode of ['desk', 'phone']) {
  const ctx = await browser.newContext(mode === 'phone' ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log(mode, 'pageerror', e.message.slice(0, 120)))
  await page.goto(base + '/rings', { waitUntil: 'load' }); await page.waitForTimeout(4000)
  await page.screenshot({ path: `look/rings-${mode}-0.jpg`, type: 'jpeg', quality: 60 })
  await page.evaluate(() => document.querySelector('#list')?.scrollIntoView()); await page.waitForTimeout(2500)
  await page.screenshot({ path: `look/rings-${mode}-1.jpg`, type: 'jpeg', quality: 60 })
  await page.goto(base + '/piece/filigree-heart-ring', { waitUntil: 'load' }); await page.waitForTimeout(3000)
  await page.screenshot({ path: `look/rings-${mode}-2.jpg`, type: 'jpeg', quality: 60 })
  await ctx.close()
}
await browser.close()
