import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined })
await ctx.addInitScript(() => { try { sessionStorage.setItem('platera:entered', '1') } catch {} })
const page = await ctx.newPage()
await page.goto(`${base}/about`, { waitUntil: 'load' }); await page.waitForTimeout(1200)
const h = await page.evaluate(() => document.querySelector('#about-house').offsetHeight)
let i = 0
for (const f of [0.05, 0.25, 0.45, 0.65, 0.85, 0.97]) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'smooth' }), (h - 664) * f); await page.waitForTimeout(2200); console.log(f, await page.evaluate(() => [...document.querySelectorAll('.house-copy')].map((e) => e.dataset.on + ':' + getComputedStyle(e).opacity).join(' '))); await page.screenshot({ path: `look/ab-${i++}.jpg`, type: 'jpeg', quality: 60 }) }
await browser.close()
