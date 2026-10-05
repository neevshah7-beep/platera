// End-to-end purchase against the local dev server with PAYMENTS_DEV_SIMULATE=1.
//   node scripts/e2e-purchase.mjs <piece-slug> <screenshotDir>
// Test buyer details below are fixtures for local runs only.
import { chromium } from 'playwright-core'

const [, , slug = 'station-chain-set', out = 'shots'] = process.argv
const base = process.env.SHOT_BASE ?? 'http://localhost:3000'
const buyer = { name: 'Test Buyer', phone: '9876543210', email: 'buyer@example.test', line1: '12 Test Road', city: 'Mumbai', pincode: '400091' }

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const desktop = process.env.E2E_DESKTOP === '1'
const page = await (await browser.newContext(desktop ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage()
const step = (s) => console.log('·', s)

await page.goto(`${base}/piece/${slug}`)
step(`PDP loaded: ${await page.locator('h1').innerText()}`)
await page.getByRole('button', { name: 'Add to bag' }).first().click()
await page.getByText('Added to your bag.').waitFor()
step('Added to bag')

await page.goto(`${base}/bag`)
await page.screenshot({ path: `${out}/e2e-1-bag.png`, fullPage: true })
await page.getByRole('link', { name: 'Continue to checkout' }).click()
await page.waitForURL('**/checkout')
step('At checkout')

await page.getByRole('button', { name: /^Pay/ }).click()
await page.getByText('Please check the highlighted fields.').waitFor()
step('Empty form rejected with field messages')

await page.getByLabel('Full name').fill(buyer.name)
await page.getByLabel('Mobile number').fill(buyer.phone)
await page.getByLabel('Email, for your receipt').fill(buyer.email)
await page.getByLabel('House, building, street').fill(buyer.line1)
await page.getByLabel('City').fill(buyer.city)
await page.getByLabel('PIN code').fill(buyer.pincode)
await page.getByLabel(/I’ve read these conditions/).check()
await page.screenshot({ path: `${out}/e2e-2-checkout.png`, fullPage: true })
await page.getByRole('button', { name: /^Pay/ }).click()
await page.waitForURL('**/checkout/pay/**', { waitUntil: 'commit' })
step(`Payment page: ${page.url().split('/pay/')[1].split('?')[0]}`)

if (process.env.E2E_PACK === '1') {
  await page.waitForSelector('.ceremony-canvas[data-started]', { timeout: 60_000 })
  console.log('t0 info', await page.evaluate(() => ({ now: Math.round(performance.now()), started: document.querySelector('.ceremony-canvas')?.dataset.started })))
  for (let i = 0; i < 7; i++) {
    await page.waitForTimeout(i === 0 ? 150 : 900)
    await page.screenshot({ path: `${out}/pack-${i}.png`, clip: { x: 200, y: 64, width: 1040, height: 760 } })
  }
  await browser.close()
  process.exit(0)
}
// The ceremony: packing, the journey, then the wax seal.
await page.waitForTimeout(3200)
await page.screenshot({ path: `${out}/e2e-c1-packing.png` })
await page.waitForSelector('.journey', { state: 'attached', timeout: 30_000 })
await page.waitForTimeout(3600)
await page.screenshot({ path: `${out}/e2e-c2-journey.png` })
await page.waitForSelector('.wax-seal', { timeout: 30_000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/e2e-c3-seal.png` })
const seal = await page.locator('.wax-seal').boundingBox()
await page.mouse.move(seal.x + seal.width / 2, seal.y + seal.height / 3)
await page.mouse.down()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/e2e-c4-sealing.png` })
await page.waitForTimeout(900)
await page.mouse.up()
step('Sealed')
await page.waitForURL('**/order/**')
const heading = await page.locator('h1').innerText()
step(`Order page: "${heading}"`)
await page.screenshot({ path: `${out}/e2e-3-order.png`, fullPage: true })

await page.goto(`${base}/piece/${slug}`)
const sold = await page.getByText('Sold', { exact: true }).first().isVisible()
step(`PDP after purchase shows Sold: ${sold}`)
await page.goto(`${base}/bag`)
step(`Bag after purchase: "${await page.locator('h1').innerText()}"`)
await browser.close()
if (!heading.startsWith('Thank you') || !sold) process.exit(1)
