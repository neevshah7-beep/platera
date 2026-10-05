import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
await ctx.addInitScript(() => sessionStorage.setItem('platera:entered', '1'))
const page = await ctx.newPage()
await page.goto((process.env.BASE ?? 'http://localhost:3000') + '/', { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(1500)
for (const f of (process.env.F ?? '0.2,0.6').split(',').map(Number)) {
  await page.evaluate((f) => { const s = document.getElementById(process.env?.ID ?? 'chapter-collection') ; }, f).catch(() => {})
  await page.evaluate(([f, id]) => { const s = document.getElementById(id); window.scrollTo(0, s.getBoundingClientRect().top + scrollY + f * (s.offsetHeight - innerHeight)) }, [f, process.env.ID ?? 'chapter-collection'])
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `look/${(process.env.ID ?? 'chapter-collection').replace('chapter-', '')}-${f}.png` })
}
await browser.close()
