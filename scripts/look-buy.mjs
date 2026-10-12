// The WhatsApp buying path, on phone and desktop: piece page -> Buy -> packing -> Send on WhatsApp.
// Also the Viewing overlay from the collection, the phone menu, and the About door chapter.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const slug = process.env.SLUG ?? 'open-square-necklace-set'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
for (const mode of ['phone', 'desk']) {
  const ctx = await browser.newContext(mode === 'phone' ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && !/X4122|X3595|GL Driver/.test(m.text()) && console.log(mode, 'console:', m.text().slice(0, 160)))
  page.on('pageerror', (e) => console.log(mode, 'pageerror:', e.message.slice(0, 160)))
  const shot = (n) => page.screenshot({ path: `look/buy-${mode}-${n}.jpg`, type: 'jpeg', quality: 62 })
  await page.goto(`${base}/piece/${slug}`, { waitUntil: 'load' }); await page.waitForTimeout(1500); await shot('0-piece')
  const links = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /wa\.me|\/buy\//.test(a.href)).map((a) => a.textContent.trim().slice(0, 22) + ' -> ' + decodeURIComponent(a.href).slice(0, 150).replace(/\n/g, ' | ')))
  console.log(mode, [...new Set(links)].join('\n   '))
  const t0 = Date.now()
  await page.getByRole('link', { name: /buy on whatsapp/i }).first().click(); await page.waitForURL(/\/buy\//, { timeout: 20000 })
  console.log(mode, 'buy page in', Date.now() - t0, 'ms')
  for (const [n, t] of [['1-pack', 1500], ['2-pack', 3500], ['3-pack', 4000], ['4-pack', 5000]]) { await page.waitForTimeout(t); await shot(n) }
  await page.getByRole('link', { name: /send on whatsapp/i }).waitFor({ timeout: 60000 }).catch(() => console.log(mode, 'no send button after 60s'))
  await page.waitForTimeout(900); await shot('5-ready')
  console.log(mode, 'send ->', decodeURIComponent(await page.getByRole('link', { name: /send on whatsapp/i }).getAttribute('href').catch(() => 'MISSING')).replace(/\n/g, ' | '), 'after', Date.now() - t0, 'ms')
  // viewing overlay from the collection list
  await page.goto(`${base}/collection`, { waitUntil: 'load' }); await page.waitForTimeout(2500)
  const view = page.getByRole('button', { name: /view product/i }).first()
  if (await view.count()) { await view.click({ timeout: 5000 }).catch((e) => console.log(mode, 'view click:', e.message.slice(0, 80))); await page.waitForTimeout(1800); await shot('6-viewing') } else console.log(mode, 'no view button')
  if (mode === 'phone') {
    await page.goto(`${base}/about`, { waitUntil: 'load' }); await page.waitForTimeout(1200)
    const h = await page.evaluate(() => document.querySelector('#about-house').offsetHeight)
    for (const [n, f] of [['7-about-a', 0.5], ['7-about-b', 0.92]]) { await page.evaluate((y) => scrollTo(0, y), (h - 844) * f); await page.waitForTimeout(1600); await shot(n) }
    await page.goto(`${base}/visit`, { waitUntil: 'load' }); await page.waitForTimeout(800)
    await page.getByRole('button', { name: 'Menu' }).first().tap(); await page.waitForTimeout(900); await shot('8-menu')
    await page.goto(`${base}/`, { waitUntil: 'commit' }); await page.waitForTimeout(700); await shot('9-home-700'); await page.waitForTimeout(1500); await shot('9-home-2200')
  }
  await ctx.close()
}
await browser.close()
