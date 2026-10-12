import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const desk = process.argv[2] === 'desk'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(desk ? { viewport: { width: 1440, height: 900 } } : { ...devices['iPhone 13'], defaultBrowserType: undefined })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(2000)
const { top, h, vh } = await page.evaluate(() => { const s = document.querySelector('#chapter-sitting'); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight } })
let i = 0
for (const f of [-0.12, -0.04, 0.0, 0.03, 0.06, 0.1, 0.16]) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top + (h - vh) * f); await page.waitForTimeout(1500); await page.screenshot({ path: `look/sp-${i++}.jpg`, type: 'jpeg', quality: 60 }) }
console.log(await page.evaluate(() => [...document.querySelectorAll('#chapter-sitting [class*=intro], #chapter-sitting h2')].slice(0, 4).map((e) => e.className + ' ' + JSON.stringify(e.getBoundingClientRect().toJSON(), (k, v) => typeof v === 'number' ? Math.round(v) : v))))
await browser.close()
