// Renders the page with each pass enabled alone and reports the mean of a probe rect.
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
const [, , path = '/?tier=3', rect = '560,240,640,300'] = process.argv
const [x0, y0, x1, y1] = rect.split(',').map(Number)
const PASSES = ['gtao', 'ssr', 'dof', 'motionBlur', 'bloom', 'chromatic', 'lut', 'vignette', 'grain', 'taa']
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://localhost:3000' + path, { waitUntil: 'load', timeout: 120000 })
await page.waitForFunction(() => document.documentElement.dataset.worldReady === '1' && window.__world?.post, null, { timeout: 90000 })
await page.waitForTimeout(2500)
const all = (v) => Object.fromEntries(PASSES.map((p) => [p, v]))
const probe = async (label) => {
  const buf = await page.screenshot({ clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } })
  const png = PNG.sync.read(buf)
  let s = 0, dark = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const l = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3
    s += l
    if (l < 8) dark++
  }
  console.log(label.padEnd(16), 'mean', (s / (png.data.length / 4)).toFixed(1), 'pureBlackPx', dark)
}
for (const only of ['none', ...PASSES]) {
  await page.evaluate((p) => window.__world.post.set(p), only === 'none' ? all(false) : { ...all(false), [only]: true })
  await page.waitForTimeout(700)
  await probe(only)
}
await browser.close()
