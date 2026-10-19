// N real browsers (phones) on one connection, arriving a couple of seconds apart, each
// loading and scrolling the whole homepage. Reports any blocked (403/429) or failed request.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE ?? 'https://www.platerajewellers.in'
const N = Number(process.argv[2] ?? 12)
const GAP = Number(process.argv[3] ?? 1700)
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] })
let total = 0
const bad = {}
const visit = async (i) => {
  await new Promise((r) => setTimeout(r, i * GAP))
  const ctx = await browser.newContext({ ...devices['Pixel 7'], defaultBrowserType: undefined })
  const page = await ctx.newPage()
  page.on('response', (r) => { total++; if (r.status() >= 400) { const k = `${r.status()} ${new URL(r.url()).pathname.replace(/\.[0-9a-f]{10}\.pack$/, '.pack').slice(0, 50)}`; bad[k] = (bad[k] ?? 0) + 1 } })
  page.on('requestfailed', (r) => { const k = `failed ${new URL(r.url()).pathname.slice(0, 50)} ${r.failure()?.errorText}`; if (!/ERR_ABORTED/.test(k)) bad[k] = (bad[k] ?? 0) + 1 })
  try {
    await page.goto(base + '/', { waitUntil: 'load', timeout: 60000 })
    const H = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let s = 0; s <= 20; s++) { await page.evaluate((y) => scrollTo(0, y), (s / 20) * H); await page.waitForTimeout(400) }
  } catch (e) { bad['visit error ' + e.message.slice(0, 60)] = (bad['visit error ' + e.message.slice(0, 60)] ?? 0) + 1 }
  await ctx.close()
}
await Promise.all(Array.from({ length: N }, (_, i) => visit(i)))
await browser.close()
console.log(N, 'visitors,', total, 'responses;', Object.keys(bad).length ? bad : 'nothing blocked or failed')
