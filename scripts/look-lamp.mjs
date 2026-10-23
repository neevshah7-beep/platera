// The piece page's lamp view of a piece, at two lamp positions. PIECE=/piece/... node scripts/look-lamp.mjs
import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 160)))
await page.goto(base + (process.env.PIECE ?? '/piece/nataraja-pendant'), { waitUntil: 'load' })
await page.waitForTimeout(6000)
const c = await page.$('canvas')
const b = await c.boundingBox()
for (const [k, fx] of [[0, 0.15], [1, 0.85]]) {
  await page.mouse.move(b.x + b.width * fx, b.y + b.height * 0.3)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `look/oct23/lamp-${k}.jpg`, type: 'jpeg', quality: 85, clip: b })
}
await browser.close()
