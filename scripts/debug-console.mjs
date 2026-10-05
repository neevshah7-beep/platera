// Prints a page's console and world state after a wait. node scripts/debug-console.mjs /path [seconds]
import { chromium } from 'playwright-core'
const [, , path = '/', secs = '20'] = process.argv
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 400)))
page.on('pageerror', (e) => console.log('[pageerror]', e.message, e.stack?.split('\n').slice(0, 4).join(' | ')))
await page.goto('http://localhost:3000' + path, { waitUntil: 'load', timeout: 120000 })
await page.waitForTimeout(Number(secs) * 1000)
console.log('STATE', JSON.stringify(await page.evaluate(() => ({ ready: document.documentElement.dataset.worldReady, world: document.documentElement.dataset.world, post: !!window.__world?.post, cam: window.__world?.camera?.() }))))
await page.screenshot({ path: 'verify/debug.png' })
await browser.close()
