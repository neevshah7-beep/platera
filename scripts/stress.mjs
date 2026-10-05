// Crash stress: scroll the homepage top↔bottom three times; report errors, lost contexts, heap.
import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] })
const page = await (await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 })).newPage()
const log = []
page.on('pageerror', (e) => log.push('pageerror ' + e.message))
page.on('console', (m) => /context|lost|failed|error/i.test(m.text()) && !/X4122|X3595/.test(m.text()) && log.push(m.type() + ' ' + m.text().slice(0, 160)))
page.on('crash', () => log.push('PAGE CRASHED'))
await page.goto(base + '/', { waitUntil: 'load' })
await page.evaluate(() => localStorage.setItem('platera:entered', '1'))
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(3000)
await page.mouse.move(700, 450)
const heap = async () => page.evaluate(() => Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1e6))
const canv = async () => page.evaluate(() => document.querySelectorAll('canvas').length)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
for (let round = 0; round < 3; round++) {
  for (let y = 0; y < H; y += 240) { await page.mouse.wheel(0, 240); await page.waitForTimeout(40) }
  await page.waitForTimeout(800)
  log.push(`round ${round} bottom: heap ${await heap()} MB, canvases ${await canv()}`)
  for (let y = H; y > 0; y -= 240) { await page.mouse.wheel(0, -240); await page.waitForTimeout(40) }
  await page.waitForTimeout(800)
  log.push(`round ${round} top: heap ${await heap()} MB, canvases ${await canv()}`)
}
console.log(log.join('\n'))
await browser.close()
